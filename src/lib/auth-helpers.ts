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

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = "sk-" + crypto.randomBytes(32).toString("hex");
  const prefix = key.slice(0, 10);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}
