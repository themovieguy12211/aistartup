import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";

// Toggle enable/disable
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { id } = await params;
    const { isActive } = await req.json();

    const { data: key } = await supabase.from("api_keys").select("id").eq("id", id).eq("user_id", user.id).single();
    if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await supabase.from("api_keys").update({ is_active: isActive }).eq("id", id);

    return NextResponse.json({ message: isActive ? "Key enabled." : "Key revoked." });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Permanently delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { id } = await params;

    const { data: key } = await supabase.from("api_keys").select("id").eq("id", id).eq("user_id", user.id).single();
    if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await supabase.from("api_keys").delete().eq("id", id);

    return NextResponse.json({ message: "Key permanently deleted." });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
