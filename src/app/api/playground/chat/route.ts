import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";

const CONFIG: Record<string, { endpoint: string; apiKey: string; modelParam: string }> = {
  "deepseek-chat": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-chat" },
  "deepseek-reasoner": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-reasoner" },
  "deepseek-v4-pro": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-v4-pro" },
  "deepseek-v4-flash": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-v4-flash" },
  default: { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-chat" },
};

export async function POST(req: NextRequest) {
  try {
    const { model, messages } = await req.json();
    if (!model || !messages) return Response.json({ error: "Model and messages required" }, { status: 400 });

    let user = null;
    try { user = await requireUser(); } catch {}

    if (user && user.credits <= 0) {
      return Response.json({ error: "Out of credits!", code: "insufficient_credits" }, { status: 402 });
    }

    const config = CONFIG[model] || CONFIG["default"];
    if (!config.apiKey) return Response.json({ error: "Model not configured" }, { status: 503 });

    const providerRes = await fetch(config.endpoint, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.modelParam, messages, stream: true }),
    });

    if (!providerRes.ok) return Response.json({ error: `Provider error: ${providerRes.status}` }, { status: providerRes.status });

    if (user) {
      const supabase = await createServerSupabase();
      const nc = +(user.credits - 0.005).toFixed(8);
      await supabase.from("profiles").update({ credits: nc < 0 ? 0 : nc }).eq("id", user.id);
    }

    return new Response(providerRes.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
