import { createServerSupabase } from "@/lib/supabase-server";
import crypto from "crypto";

export async function getSessionUser() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    credits: profile.credits,
    role: profile.role,
    apiKeys: [], // loaded separately when needed
    usageRecords: [],
    conversations: [],
    messages: [],
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

const FREE_DAILY_TOKENS = 50_000; // 50k tokens per day for free users

export async function useFreeTokens(
  userId: string,
  totalTokens: number,
): Promise<{ freeTokens: number; chargeableTokens: number }> {
  if (totalTokens <= 0) return { freeTokens: 0, chargeableTokens: 0 };

  const { createServiceSupabase } = await import("@/lib/supabase-server");
  const supabase = await createServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);

  // Atomic RPC — no SELECT-then-UPDATE race condition
  const { data: freeGranted, error } = await supabase.rpc("consume_daily_tokens", {
    p_user_id: userId,
    p_tokens: totalTokens,
    p_today: today,
  });

  const freeTokens = error ? 0 : (freeGranted || 0);
  return { freeTokens, chargeableTokens: totalTokens - freeTokens };
}

export async function getFreeTokensRemaining(userId: string): Promise<number> {
  const { createServerSupabase } = await import("@/lib/supabase-server");
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_tokens_used, daily_tokens_date")
    .eq("id", userId)
    .single();

  if (!profile) return 0;
  const isNewDay = profile.daily_tokens_date !== today;
  return isNewDay ? FREE_DAILY_TOKENS : Math.max(0, FREE_DAILY_TOKENS - (profile.daily_tokens_used || 0));
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = "sk-" + crypto.randomBytes(32).toString("hex");
  const prefix = key.slice(0, 10);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}
