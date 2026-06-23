import { NextRequest, NextResponse } from "next/server";
import { requireUser, generateApiKey } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    const { data: rawKeys } = await supabase
      .from("api_keys")
      .select("id, prefix, name, is_active, last_used_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const keys = (rawKeys || []).map((k) => ({
      id: k.id,
      prefix: k.prefix,
      name: k.name,
      isActive: k.is_active,
      lastUsedAt: k.last_used_at,
      createdAt: k.created_at,
    }));

    return NextResponse.json({ keys });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { name } = await req.json();
    const { key, prefix, hash } = generateApiKey();

    await supabase.from("api_keys").insert({
      key, prefix, hash, name: name || null, user_id: user.id,
    });

    return NextResponse.json({ key, prefix }, { status: 201 });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
