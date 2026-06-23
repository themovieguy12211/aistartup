import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, title, updated_at, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    // Get message counts and map to camelCase
    const withCounts = await Promise.all(
      (conversations || []).map(async (c) => {
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.id);
        return {
          id: c.id,
          title: c.title,
          updatedAt: c.updated_at,
          createdAt: c.created_at,
          _count: { messages: count || 0 },
        };
      })
    );

    return NextResponse.json({ conversations: withCounts });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { title } = await req.json();

    const { data: conversation } = await supabase
      .from("conversations")
      .insert({ title: title || "New Chat", user_id: user.id })
      .select()
      .single();

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
