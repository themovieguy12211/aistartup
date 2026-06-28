import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const supabase = await createServiceSupabase();
    const { publicId } = await params;

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, title, is_public, created_at")
      .eq("public_id", publicId)
      .eq("is_public", true)
      .single();

    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: messages } = await supabase
      .from("messages")
      .select("role, content, model, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      title: conv.title,
      messages: (messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        model: m.model,
        createdAt: m.created_at,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
