import { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { calculateCost, getModelPricing } from "@/lib/pricing";
import { apiRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

// Anthropic Messages API → provider routing
// https://docs.anthropic.com/en/api/messages

async function forwardToProvider(model: string, body: Record<string, unknown>) {
  // DeepSeek models → use DeepSeek API (supports Anthropic format natively)
  if (model.startsWith("deepseek-") || model === "deepseek-chat" || model === "deepseek-reasoner") {
    const res = await fetch("https://api.deepseek.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...body, model }),
    });
    return { res, provider: "deepseek", usedModel: model };
  }

  // Claude, Llama, Mistral → AWS Bedrock when configured (credit-covered)
  // Bedrock requires AWS SDK integration — coming when you get your credits
  // For now, these models fall back to DeepSeek
  if (model.startsWith("claude-") || model.startsWith("llama-") || model.startsWith("mistral-")) {
    const res = await fetch("https://api.deepseek.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...body, model: "deepseek-chat" }),
    });
    return { res, provider: "deepseek", usedModel: "deepseek-v4-pro" };
  }

  // Default → DeepSeek
  const res = await fetch("https://api.deepseek.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ ...body, model: "deepseek-chat" }),
  });
  return { res, provider: "deepseek", usedModel: "deepseek-chat" };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = apiRateLimit(ip);
    if (!rl.allowed) {
      return Response.json(
        { type: "error", error: { type: "rate_limit_error", message: "Rate limit exceeded" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Auth via x-api-key or Authorization header
    const authHeader = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return Response.json(
        { type: "error", error: { type: "authentication_error", message: "Missing x-api-key header" } },
        { status: 401 }
      );
    }

    const rawKey = authHeader;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const supabase = await createServiceSupabase();
    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("*, profiles!inner(*)")
      .eq("hash", keyHash)
      .single();

    if (!apiKey || !apiKey.is_active) {
      return Response.json(
        { type: "error", error: { type: "authentication_error", message: "Invalid API key" } },
        { status: 401 }
      );
    }

    const profile = apiKey.profiles;
    if (profile.credits <= 0) {
      return Response.json(
        { type: "error", error: { type: "permission_error", message: "Insufficient credits. Add credits to continue." } },
        { status: 402 }
      );
    }

    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);

    // Parse Anthropic request
    const body = await req.json();
    // Strip context suffixes like [1m], [200k], etc.
    const rawModel = body.model || "deepseek-v4-pro";
    const model = rawModel.replace(/\[\d+\w\]/g, "");
    const stream = body.stream || false;

    // Forward to provider
    const { res: providerRes, provider, usedModel } = await forwardToProvider(model, body);

    if (!providerRes.ok) {
      const errText = await providerRes.text();
      return Response.json(
        { type: "error", error: { type: "api_error", message: `Provider error: ${providerRes.status}` } },
        { status: providerRes.status }
      );
    }

    // If streaming, pass through
    if (stream) {
      const preAuth = 0.001;
      const nc = +(profile.credits - preAuth).toFixed(8);
      await supabase.from("profiles").update({ credits: nc }).eq("id", profile.id);

      return new Response(providerRes.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "anthropic-version": "2023-06-01",
        },
      });
    }

    // Non-streaming: parse, deduct, return
    const data = await providerRes.json();

    // Estimate tokens from usage or content length
    const tokensIn = data.usage?.input_tokens || 500;
    const tokensOut = data.usage?.output_tokens || 500;
    const cost = calculateCost(model, tokensIn, tokensOut);
    const newCredits = +(profile.credits - cost).toFixed(8);

    await supabase.from("profiles").update({ credits: newCredits }).eq("id", profile.id);
    await supabase.from("usage_records").insert({
      model: usedModel, provider, tokens_in: tokensIn, tokens_out: tokensOut, cost,
      api_key_id: apiKey.id, user_id: profile.id,
    });

    const pricing = getModelPricing(model);
    const responseData = {
      ...data,
      aragoniteai: {
        model: usedModel, provider,
        cost: `$${cost.toFixed(6)}`,
        rate: `$${pricing.pricePerMIn}/M in, $${pricing.pricePerMOut}/M out`,
        credits_remaining: newCredits,
      },
    };

    return Response.json(responseData);
  } catch (e) {
    console.error("Anthropic API error:", e);
    return Response.json(
      { type: "error", error: { type: "api_error", message: "Internal error" } },
      { status: 500 }
    );
  }
}
