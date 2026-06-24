import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServerSupabase } from "@/lib/supabase-server";
import { calculateCost } from "@/lib/pricing";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information. Use this for facts, news, prices, availability checks, or anything that requires up-to-date data.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "The search query" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_page",
      description: "Fetch and read the full content of a webpage. Use this when search snippets aren't enough and you need the complete article or page.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "The URL to fetch" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_github_repo",
      description: "Read a GitHub repository — gets the README, file structure, package.json, and tech stack.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repo owner" },
          repo: { type: "string", description: "Repo name" },
        },
        required: ["owner", "repo"],
      },
    },
  },
];

async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  switch (name) {
    case "web_search": {
      const key = process.env.SERPER_API_KEY;
      if (!key) return "Search not configured.";
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ q: args.query, num: 8 }),
      });
      if (!res.ok) return `Search failed: ${res.status}`;
      const data = await res.json();
      return (data.organic || []).map((r: { title: string; link: string; snippet: string }) =>
        `${r.title}\n  ${r.link}\n  ${r.snippet}`
      ).join("\n\n") || "No results.";
    }

    case "fetch_page": {
      try {
        const res = await fetch(args.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AragoniteAI/1.0)" },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return `Page fetch failed: ${res.status}`;
        const html = await res.text();
        const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 8000);
        return text || "Page was empty or JS-only.";
      } catch (e) {
        return `Fetch error: ${(e as Error).message}`;
      }
    }

    case "fetch_github_repo": {
      try {
        const [readmeRes, pkgRes] = await Promise.all([
          fetch(`https://raw.githubusercontent.com/${args.owner}/${args.repo}/main/README.md`),
          fetch(`https://raw.githubusercontent.com/${args.owner}/${args.repo}/main/package.json`),
        ]);
        const readme = readmeRes.ok ? await readmeRes.text() : "No README found.";
        let techStack = "";
        if (pkgRes.ok) {
          const pkg = await pkgRes.json();
          techStack = "Tech stack: " + Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(", ");
        }
        return `## ${args.owner}/${args.repo}\n\n${techStack}\n\nREADME:\n${readme.slice(0, 6000)}`;
      } catch (e) {
        return `GitHub fetch error: ${(e as Error).message}`;
      }
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();
    const { id } = await params;
    const { model, content, displayContent } = await req.json();

    if (!content?.trim()) return Response.json({ error: "Message required" }, { status: 400 });
    if (user.credits <= 0) return Response.json({ error: "Out of credits!", code: "insufficient_credits" }, { status: 402 });

    // Save the clean user message (without search context)
    const cleanContent = displayContent || content.trim();

    const { data: conversation } = await supabase.from("conversations").select("*").eq("id", id).eq("user_id", user.id).single();
    if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });

    const selectedModel = model || "deepseek-chat";

    // Save user message
    await supabase.from("messages").insert({
      role: "user", content: cleanContent, model: null, conversation_id: id, user_id: user.id,
    });

    // Build message history
    const { data: history } = await supabase.from("messages").select("role, content").eq("conversation_id", id).order("created_at", { ascending: true });
    const messages: { role: string; content: string; tool_calls?: unknown[]; tool_call_id?: string }[] = [
      ...(history || []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: content.trim() },
    ];

    // === FUNCTION CALLING LOOP ===
    const encoder = new TextEncoder();
    let fullContent = "";
    let reasoningContent = "";
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    const toolCalls: { name: string; args: Record<string, string>; result: string }[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentMessages = [...messages];
          let turnCount = 0;
          const maxTurns = 5; // max 5 function call rounds

          while (turnCount < maxTurns) {
            turnCount++;

            // Send tool use progress to client
            if (toolCalls.length > 0) {
              const lastCall = toolCalls[toolCalls.length - 1];
              controller.enqueue(encoder.encode(
                `data: {"aragoniteai_tool": ${JSON.stringify({ name: lastCall.name, args: lastCall.args, result: lastCall.result.slice(0, 200) + "..." })}}\n\n`
              ));
            }

            const providerRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}`,
              },
              body: JSON.stringify({
                model: selectedModel,
                messages: currentMessages,
                tools: TOOLS,
                tool_choice: turnCount < maxTurns - 1 ? "auto" : "auto",
                stream: false, // non-streaming for function calling loop
              }),
            });

            if (!providerRes.ok) {
              controller.enqueue(encoder.encode(`data: {"error": "Provider error: ${providerRes.status}"}\n\n`));
              break;
            }

            const data = await providerRes.json();
            const choice = data.choices?.[0];
            const msg = choice?.message;

            totalTokensIn += data.usage?.prompt_tokens || 0;
            totalTokensOut += data.usage?.completion_tokens || 0;

            // If the model called a function
            if (msg?.tool_calls?.length) {
              for (const tc of msg.tool_calls) {
                const funcName = tc.function.name;
                const funcArgs = JSON.parse(tc.function.arguments || "{}");

                // Send tool call to client
                controller.enqueue(encoder.encode(
                  `data: {"aragoniteai_tool_call": ${JSON.stringify({ name: funcName, args: funcArgs })}}\n\n`
                ));

                // Execute the tool
                const result = await executeTool(funcName, funcArgs);
                toolCalls.push({ name: funcName, args: funcArgs, result });

                // Send tool result to client
                controller.enqueue(encoder.encode(
                  `data: {"aragoniteai_tool_result": ${JSON.stringify({ name: funcName, result: result.slice(0, 500) })}}\n\n`
                ));

                // Add to conversation
                currentMessages.push({
                  role: "assistant",
                  content: null as unknown as string,
                  tool_calls: [tc],
                });
                currentMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: result,
                });
              }
              continue; // loop again for model to process tool results
            }

            // Final text response
            fullContent = msg?.content || "";

            // Send as stream chunks (simulate streaming for the client)
            const words = fullContent.split(/(\s+)/);
            for (const word of words) {
              controller.enqueue(encoder.encode(
                `data: {"choices":[{"delta":{"content":${JSON.stringify(word)}}}]}\n\n`
              ));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            break;
          }

          // Save assistant message
          const cost = Math.max(calculateCost(selectedModel, totalTokensIn, totalTokensOut), 0.0001);
          const newCredits = +(user.credits - cost).toFixed(8);

          await supabase.from("messages").insert({
            role: "assistant", content: fullContent, model: selectedModel,
            tokens_in: totalTokensIn, tokens_out: totalTokensOut, cost,
            conversation_id: id, user_id: user.id,
          });

          await supabase.from("profiles").update({ credits: newCredits < 0 ? 0 : newCredits }).eq("id", user.id);
          await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);

          // Auto-title — strip system prompt if present
          const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", id);
          if ((count || 0) <= 2) {
            const cleanContent = content.trim().replace(/^\[System:[^\]]*\]\s*\n*/g, "");
            const title = cleanContent.slice(0, 40) + (cleanContent.length > 40 ? "..." : "");
            await supabase.from("conversations").update({ title }).eq("id", id);
          }

          // Send tool calls summary
          if (toolCalls.length > 0) {
            controller.enqueue(encoder.encode(
              `data: {"aragoniteai_reasoning": ${JSON.stringify(toolCalls.map(tc => `🔧 ${tc.name}(${Object.values(tc.args).join(", ")})`).join("\n"))}}\n\n`
            ));
          }

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
