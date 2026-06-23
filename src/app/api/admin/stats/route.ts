import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createServiceSupabase();
    const [{ count: totalUsers }, { count: totalCalls }, { count: activeKeys }, { count: admins }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("usage_records").select("*", { count: "exact", head: true }),
      supabase.from("api_keys").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    ]);

    const { data: allUsage } = await supabase.from("usage_records").select("cost");
    const totalRevenue = allUsage?.reduce((s, r) => s + (r.cost || 0), 0) || 0;
    const totalCost = totalRevenue / 1.15;

    return NextResponse.json({
      totalUsers: totalUsers || 0, totalRevenue: +totalRevenue.toFixed(4), totalCost: +totalCost.toFixed(4),
      totalCalls: totalCalls || 0, activeKeys: activeKeys || 0, adminCount: admins || 0,
    });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
