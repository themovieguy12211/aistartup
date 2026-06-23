import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth-helpers";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createServiceSupabase();

    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

    const users = await Promise.all((profiles || []).map(async (p) => {
      const { count: keyCount } = await supabase.from("api_keys").select("*", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: usageCount } = await supabase.from("usage_records").select("*", { count: "exact", head: true }).eq("user_id", p.id);
      return { ...p, _count: { apiKeys: keyCount || 0, usageRecords: usageCount || 0 } };
    }));

    return NextResponse.json({ users });
  } catch (e) {
    if ((e as Error).message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createServiceSupabase();
    const { userId, amount, role } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (amount !== undefined) {
      const { data: profile } = await supabase.from("profiles").select("credits").eq("id", userId).single();
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
      updates.credits = +(profile.credits + amount).toFixed(8);
    }
    if (role !== undefined) updates.role = role;

    if (!Object.keys(updates).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    await supabase.from("profiles").update(updates).eq("id", userId);
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
