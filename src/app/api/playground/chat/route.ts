import { NextRequest } from "next/server";
import { requireUser, useFreeTokens, getFreeTokensRemaining } from "@/lib/auth-helpers";
import { createServiceSupabase } from "@/lib/supabase-server";

const PLAYGROUND_COST_TOKENS = 500;

const CONFIG: Record<string, { endpoint: string; apiKey: string; modelParam: string }> = {
  "deepseek-v4-pro": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-v4-pro" },
  "deepseek-v4-flash": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-v4-flash" },
  default: { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-v4-flash" },
};

export async function POST(req: NextRequest) {
  try {
    const { model, messages } = await req.json();
    if (!model || !messages) return Response.json({ error: "Model and messages required" }, { status: 400 });

    const user = await requireUser(); // Must be authenticated
    if (user.role !== "admin") {
      return Response.json({ error: "Playground is for admin testing only." }, { status: 403 });
    }

    if (user.credits <= 0) {
      const freeRemaining = await getFreeTokensRemaining(user.id);
      if (freeRemaining <= 0) {
        return Response.json({ error: "Out of credits and daily free tokens!", code: "insufficient_credits" }, { status: 402 });
      }
    }

    const config = CONFIG[model] || CONFIG["default"];
    if (!config.apiKey) return Response.json({ error: "Model not configured" }, { status: 503 });

    const providerRes = await fetch(config.endpoint, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.modelParam, messages, stream: true }),
    });

    if (!providerRes.ok) return Response.json({ error: `Provider error: ${providerRes.status}` }, { status: providerRes.status });

    if (user) {
      const supabase = await createServiceSupabase();
      const { chargeableTokens } = await useFreeTokens(user.id, PLAYGROUND_COST_TOKENS);
      if (chargeableTokens > 0) {
        const nc = +(user.credits - 0.005).toFixed(8);
        await supabase.from("profiles").update({ credits: nc < 0 ? 0 : nc }).eq("id", user.id);
      }
    }

    return new Response(providerRes.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
