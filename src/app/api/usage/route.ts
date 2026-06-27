import { NextResponse } from "next/server";
import { requireUser, getFreeTokensRemaining } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    const { data: records } = await supabase.from("usage_records").select("tokens_in, tokens_out, cost").eq("user_id", user.id);
    const { count: activeKeys } = await supabase.from("api_keys").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true);

    const totalRequests = records?.length || 0;
    const totalTokens = records?.reduce((s, r) => s + (r.tokens_in || 0) + (r.tokens_out || 0), 0) || 0;
    const totalCost = records?.reduce((s, r) => s + (r.cost || 0), 0) || 0;
    const dailyFreeTokens = await getFreeTokensRemaining(user.id as string);

    return NextResponse.json({ totalRequests, totalTokens, totalCost, activeKeys: activeKeys || 0, credits: user.credits, dailyFreeTokens });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
