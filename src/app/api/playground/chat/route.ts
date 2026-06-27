import { NextRequest } from "next/server";
import { requireUser, useFreeTokens, getFreeTokensRemaining } from "@/lib/auth-helpers";
import { createServiceSupabase } from "@/lib/supabase-server";

const PLAYGROUND_COST_TOKENS = 500; // est. tokens per playground message (~$0.005 with cheap models)

const CONFIG: Record<string, { endpoint: string; apiKey: string; modelParam: string }> = {
  "deepseek-chat": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-chat" },
  "deepseek-reasoner": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-reasoner" },
  "deepseek-v4-pro": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-v4-pro" },
  "deepseek-v4-flash": { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-v4-flash" },
  default: { endpoint: "https://api.deepseek.com/v1/chat/completions", apiKey: process.env.DEEPSEEK_API_KEY || "", modelParam: "deepseek-chat" },
};

const GUEST_LIMIT = 5;
const GUEST_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const guestRateMap = new Map<string, { count: number; resetAt: number }>();

function checkGuestRate(ip: string): boolean {
  const now = Date.now();
  const entry = guestRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    guestRateMap.set(ip, { count: 1, resetAt: now + GUEST_WINDOW_MS });
    return true;
  }
  if (entry.count >= GUEST_LIMIT) return false;
  entry.count++;
  return true;
}

// Evict expired entries periodically to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of guestRateMap) {
    if (now > entry.resetAt) guestRateMap.delete(ip);
  }
}, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const { model, messages } = await req.json();
    if (!model || !messages) return Response.json({ error: "Model and messages required" }, { status: 400 });

    let user = null;
    try { user = await requireUser(); } catch {}

    // Server-side rate limit for unauthenticated (guest) users
    if (!user) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
        || "unknown";
      if (!checkGuestRate(ip)) {
        return Response.json(
          { error: "Guest limit reached. Create a free account to continue.", code: "guest_limit" },
          { status: 429 }
        );
      }
    }

    if (user && user.credits <= 0) {
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
