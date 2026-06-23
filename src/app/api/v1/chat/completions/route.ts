import { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { calculateCost, getModelPricing } from "@/lib/pricing";
import { apiRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

function getProviderConfig(model: string) {
  // DeepSeek V4 models — route to DeepSeek API
  if (model.startsWith("deepseek-v4")) {
    return { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: model, provider: "deepseek" };
  }
  if (model.startsWith("claude-")) {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      return { endpoint: "https://api.anthropic.com/v1/messages", apiKey: anthropicKey, modelParam: model, provider: "anthropic" };
    }
    return { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-chat", provider: "deepseek" };
  }
  if (model.startsWith("llama-")) {
    return { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-chat", provider: "deepseek" };
  }
  return { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: model || "deepseek-chat", provider: "deepseek" };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = apiRateLimit(ip);
    if (!rl.allowed) return Response.json({ error: "Rate limit exceeded" }, { status: 429 });

    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return Response.json({ error: "Missing Authorization header" }, { status: 401 });

    const rawKey = authHeader.slice(7);
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const supabase = await createServiceSupabase();
    const { data: apiKey } = await supabase.from("api_keys").select("*, profiles!inner(*)").eq("hash", keyHash).single();

    if (!apiKey || !apiKey.is_active) return Response.json({ error: "Invalid API key" }, { status: 401 });

    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);

    const profile = apiKey.profiles;
    if (profile.credits <= 0) return Response.json({ error: "Insufficient credits", code: "insufficient_credits" }, { status: 402 });

    const body = await req.json();
    const { model = "deepseek-chat", messages, stream = false } = body;
    if (!messages?.length) return Response.json({ error: "Messages array required" }, { status: 400 });

    const config = getProviderConfig(model);
    let providerRes: Response, usedProvider: string, usedModel: string;

    try {
      providerRes = await fetch(config.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify({ model: config.modelParam, messages, stream }) });
      usedProvider = config.provider; usedModel = config.modelParam;
      if (!providerRes.ok && (config as any).fallback) {
        providerRes = await fetch((config as any).fallback.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${(config as any).fallback.apiKey}` }, body: JSON.stringify({ model: (config as any).fallback.modelParam, messages, stream }) });
        usedProvider = (config as any).fallback.provider; usedModel = (config as any).fallback.modelParam;
      }
    } catch {
      if ((config as any).fallback) {
        providerRes = await fetch((config as any).fallback.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${(config as any).fallback.apiKey}` }, body: JSON.stringify({ model: (config as any).fallback.modelParam, messages, stream }) });
        usedProvider = (config as any).fallback.provider; usedModel = (config as any).fallback.modelParam;
      } else throw new Error("Provider failed");
    }

    if (!providerRes.ok) return Response.json({ error: `Upstream error: ${providerRes.status}` }, { status: providerRes.status });

    if (stream) {
      const preAuth = 0.001;
      const nc = +(profile.credits - preAuth).toFixed(8);
      await supabase.from("profiles").update({ credits: nc }).eq("id", profile.id);
      return new Response(providerRes.body, { headers: { "Content-Type": "text/event-stream" } });
    }

    const data = await providerRes.json();
    const tokensIn = data.usage?.prompt_tokens || 0;
    const tokensOut = data.usage?.completion_tokens || 0;
    const cost = calculateCost(model, tokensIn, tokensOut);
    const newCredits = +(profile.credits - cost).toFixed(8);

    await supabase.from("profiles").update({ credits: newCredits }).eq("id", profile.id);
    await supabase.from("usage_records").insert({ model: usedModel, provider: usedProvider, tokens_in: tokensIn, tokens_out: tokensOut, cost, api_key_id: apiKey.id, user_id: profile.id });

    const pricing = getModelPricing(model);
    data.aragoniteai = { model: usedModel, provider: usedProvider, cost: `$${cost.toFixed(6)}`, rate: `$${pricing.pricePerMIn}/M in, $${pricing.pricePerMOut}/M out`, credits_remaining: newCredits, latency_ms: Date.now() - startTime };

    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
