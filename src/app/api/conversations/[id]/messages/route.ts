import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";
import { calculateCost } from "@/lib/pricing";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { id } = await params;
    const { model, content } = await req.json();

    if (!content?.trim()) return Response.json({ error: "Message required" }, { status: 400 });

    const { data: conversation } = await supabase.from("conversations").select("*").eq("id", id).eq("user_id", user.id).single();
    if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });

    if (user.credits <= 0) {
      return Response.json({ error: "Out of credits!", code: "insufficient_credits" }, { status: 402 });
    }

    const selectedModel = model || "deepseek-chat";

    // Save user message
    await supabase.from("messages").insert({
      role: "user", content: content.trim(), model: null, conversation_id: id, user_id: user.id,
    });

    // Auto-title
    const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", id);
    if ((count || 0) <= 1) {
      const title = content.trim().slice(0, 40) + (content.trim().length > 40 ? "..." : "");
      await supabase.from("conversations").update({ title }).eq("id", id);
    }

    // Build message history
    const { data: history } = await supabase.from("messages").select("role, content").eq("conversation_id", id).order("created_at", { ascending: true });
    const messages = [...(history || []).map((m) => ({ role: m.role, content: m.content })), { role: "user", content: content.trim() }];

    // Call AI provider
    const providerRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}` },
      body: JSON.stringify({ model: selectedModel, messages, stream: true }),
    });

    if (!providerRes.ok) {
      return Response.json({ error: `AI provider error: ${providerRes.status}` }, { status: providerRes.status });
    }

    const reader = providerRes.body?.getReader();
    if (!reader) throw new Error("No stream");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.choices?.[0]?.delta?.content) fullContent += parsed.choices[0].delta.content;
                } catch {}
              }
            }
          }

          const cost = Math.max(calculateCost(selectedModel, 0, fullContent.length), 0.0001);
          const newCredits = +(user.credits - cost).toFixed(8);

          await supabase.from("messages").insert({
            role: "assistant", content: fullContent, model: selectedModel, tokens_out: fullContent.length, cost, conversation_id: id, user_id: user.id,
          });

          await supabase.from("profiles").update({ credits: newCredits < 0 ? 0 : newCredits }).eq("id", user.id);
          await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);

          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
