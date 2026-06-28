import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { id } = await params;

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, is_public, public_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newPublic = !conv.is_public;

    const updates: Record<string, unknown> = { is_public: newPublic };
    if (newPublic && !conv.public_id) {
      updates.public_id = crypto.randomUUID();
    }

    await supabase.from("conversations").update(updates).eq("id", id);

    const origin = req.headers.get("origin") || "https://dagrai.xyz";
    const shareUrl = newPublic ? `${origin}/share/${updates.public_id || conv.public_id}` : null;

    return NextResponse.json({ isPublic: newPublic, shareUrl });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
