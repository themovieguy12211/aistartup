import { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { calculateCost, getModelPricing } from "@/lib/pricing";
import { useFreeTokens, getFreeTokensRemaining } from "@/lib/auth-helpers";
import { apiRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

// Anthropic Messages API → provider routing
// https://docs.anthropic.com/en/api/messages

async function forwardToProvider(model: string, body: Record<string, unknown>) {
  // DeepSeek models → use DeepSeek API (supports Anthropic format natively)
  if (model.startsWith("deepseek-") || model === "deepseek-chat" || model === "deepseek-reasoner") {
    const res = await fetch("https://api.deepseek.com/anthropic/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.DEEPSEEK_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...body, model }),
    });
    return { res, provider: "deepseek", usedModel: model };
  }

  // Claude, Llama, Mistral — fall back to DeepSeek V4 Pro
  if (model.startsWith("claude-") || model.startsWith("llama-") || model.startsWith("mistral-")) {
    const res = await fetch("https://api.deepseek.com/anthropic/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.DEEPSEEK_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...body, model: "deepseek-v4-pro" }),
    });
    return { res, provider: "deepseek", usedModel: "deepseek-v4-pro" };
  }

  // Default → DeepSeek
  const res = await fetch("https://api.deepseek.com/anthropic/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.DEEPSEEK_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ ...body, model: "deepseek-v4-pro" }),
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
      .select("*")
      .eq("hash", keyHash)
      .single();

    if (!apiKey || !apiKey.is_active) {
      return Response.json(
        { type: "error", error: { type: "authentication_error", message: "Invalid API key" } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", apiKey.user_id).single(); if (!profile) return Response.json({ error: "Account not found" }, { status: 401 });
    if (profile.credits <= 0) {
      const freeRemaining = await getFreeTokensRemaining(profile.id);
      if (freeRemaining <= 0) {
        return Response.json(
          { type: "error", error: { type: "permission_error", message: "Insufficient credits. Add credits to continue." } },
          { status: 402 }
        );
      }
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

    // If streaming, intercept to capture exact token usage
    if (stream) {
      const reader = providerRes.body?.getReader();
      if (!reader) throw new Error("No stream");

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let inputTokens = 0;
      let outputTokens = 0;
      let buffer = "";

      const interceptedStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              controller.enqueue(value);
              buffer += decoder.decode(value, { stream: true });

              // Parse SSE events for usage data
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.type === "message_start" && parsed.message?.usage?.input_tokens) {
                      inputTokens = parsed.message.usage.input_tokens;
                    }
                    if (parsed.type === "message_delta" && parsed.usage?.output_tokens) {
                      outputTokens = parsed.usage.output_tokens;
                    }
                  } catch {}
                }
              }
            }

            // Apply daily free tokens, then deduct remaining from credits
            const tokensUsed = (inputTokens || Math.ceil(JSON.stringify(body).length / 4)) + (outputTokens || 2000);
            const { chargeableTokens } = await useFreeTokens(profile.id, tokensUsed);
            const scale = tokensUsed > 0 ? chargeableTokens / tokensUsed : 1;
            const cost = calculateCost(usedModel, (inputTokens || 0) * scale, (outputTokens || 0) * scale);
            const nc = +(profile.credits - cost).toFixed(8);
            await supabase.from("profiles").update({ credits: nc < 0 ? 0 : nc }).eq("id", apiKey.user_id);
            await supabase.from("usage_records").insert({
              model: usedModel, provider, tokens_in: inputTokens, tokens_out: outputTokens, cost,
              api_key_id: apiKey.id, user_id: apiKey.user_id,
            });

            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });

      return new Response(interceptedStream, {
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

    // Apply daily free tokens, then deduct remaining from credits
    const tokensIn = data.usage?.input_tokens || 500;
    const tokensOut = data.usage?.output_tokens || 500;
    const totalTokens = tokensIn + tokensOut;
    const { chargeableTokens } = await useFreeTokens(profile.id, totalTokens);
    const scale = totalTokens > 0 ? chargeableTokens / totalTokens : 1;
    const cost = calculateCost(usedModel, tokensIn * scale, tokensOut * scale);
    const newCredits = +(profile.credits - cost).toFixed(8);

    await supabase.from("profiles").update({ credits: newCredits < 0 ? 0 : newCredits }).eq("id", apiKey.user_id);
    await supabase.from("usage_records").insert({
      model: usedModel, provider, tokens_in: tokensIn, tokens_out: tokensOut, cost,
      api_key_id: apiKey.id, user_id: apiKey.user_id,
    });

    const pricing = getModelPricing(model);
    const responseData = {
      ...data,
      dagrai: {
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
