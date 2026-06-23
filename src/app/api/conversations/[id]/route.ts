import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { id } = await params;

    const { data: conversation } = await supabase.from("conversations").select("*").eq("id", id).eq("user_id", user.id).single();
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: rawMessages } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });

    const messages = (rawMessages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      model: m.model,
      cost: m.cost,
      createdAt: m.created_at,
    }));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        messages,
      }
    });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { id } = await params;

    const { data: conversation } = await supabase.from("conversations").select("id").eq("id", id).eq("user_id", user.id).single();
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await supabase.from("messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
