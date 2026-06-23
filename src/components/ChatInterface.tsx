"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import { shouldSearchWeb, shouldDeepResearch } from "@/lib/query-classifier";

function mergeReasoning(existing: string[], modelReasoning: string): string[] {
  if (!modelReasoning) return existing;
  const truncated = modelReasoning.length > 2000
    ? modelReasoning.slice(0, 2000) + "..."
    : modelReasoning;
  return [...existing, `💭 ${truncated}`];
}

interface CompareResponse {
  model: string;
  content: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant" | "pipeline";
  content: string;
  model?: string | null;
  cost?: number | null;
  responses?: CompareResponse[];
  pipeline?: string[];
  reasoning?: string[]; // research steps — collapsible
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface Props {
  credits: number | null;
  onCreditsChange: () => void;
}

async function fetchResearch(
  q: string,
  onStep: (step: string) => void
): Promise<{ context: string; reasoning: string[] }> {
  try {
    const res = await fetch(`/api/research?q=${encodeURIComponent(q)}`);
    if (!res.ok) return { context: "", reasoning: ["research failed"] };
    const data = await res.json();

    // Emit steps as they come (they're all available now from the API response)
    const reasoning = data.steps || [];
    reasoning.forEach((s: string) => onStep(s));

    let ctx = "";

    // GitHub repo — quick read format
    if (data.github) {
      const gh = data.github;
      ctx += `\n\n[GitHub Repo: ${gh.name}]\n`;
      ctx += `Description: ${gh.description || "none"}\n`;
      ctx += `URL: ${gh.url}\n`;
      if (gh.techStack.length) {
        ctx += `Tech stack: ${gh.techStack.slice(0, 12).join(", ")}\n`;
      }
      if (gh.files.length) {
        ctx += `Key files (${gh.files.length} total): ${gh.files.slice(0, 20).join(", ")}\n`;
      }
      if (gh.readme) {
        ctx += `\nREADME excerpt:\n${gh.readme.slice(0, 4000)}\n`;
      }
      ctx += `\n[Provide a QUICK OVERVIEW of this repo — what it does, its tech stack, and key features. Only do a deep code review if the user explicitly asks for it.]\n`;
    }

    // Direct URL content
    if (data.directUrls?.length) {
      ctx += "\n\n[Directly fetched pages:\n";
      for (const d of data.directUrls) {
        ctx += `\n## ${d.title}\nURL: ${d.url}\n\n${d.content.slice(0, 4000)}\n`;
      }
      ctx += "]\n";
    }

    // Search snippets
    if (data.searchResults?.length) {
      ctx += "\n\n[Web results:\n";
      for (const r of data.searchResults) {
        ctx += `- ${r.title}\n  ${r.url}\n  ${r.snippet}\n\n`;
      }
      ctx += "]\n";
    }

    // Deep-read pages
    if (data.fetchedPages?.length) {
      ctx += "\n\n[Full page content:\n";
      for (const fp of data.fetchedPages) {
        ctx += `\n## ${fp.title}\nURL: ${fp.url}\n\n${fp.content.slice(0, 6000)}\n`;
      }
      ctx += "]\n";
    }

    if (!ctx) return { context: "", reasoning };

    return {
      context: ctx + "\nUse these sources to provide a thorough, well-cited answer. Be specific.",
      reasoning,
    };
  } catch {
    return { context: "", reasoning: ["research failed"] };
  }
}

async function streamOne(
  model: string, content: string, convId: string | null,
  onReasoning?: (r: string) => void
): Promise<{ text: string; reasoning: string }> {
  if (!convId) throw new Error("No conversation");
  const res = await fetch(`/api/conversations/${convId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, content }),
  });
  if (!res.ok) throw new Error(`${model}: ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No stream");
  const decoder = new TextDecoder();
  let full = "";
  let reasoning = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const p = JSON.parse(line.slice(6));
          if (p.choices?.[0]?.delta?.content) full += p.choices[0].delta.content;
          if (p.choices?.[0]?.delta?.reasoning_content) {
            reasoning += p.choices[0].delta.reasoning_content;
            if (onReasoning) onReasoning(reasoning);
          }
          if (p.aragoniteai_reasoning) {
            reasoning = p.aragoniteai_reasoning;
            if (onReasoning) onReasoning(reasoning);
          }
          // Capture function calling events as reasoning
          if (p.aragoniteai_tool_call) {
            const tc = `🔧 Calling ${p.aragoniteai_tool_call.name}(${Object.values(p.aragoniteai_tool_call.args || {}).join(", ")})...`;
            reasoning = reasoning ? reasoning + "\n" + tc : tc;
            if (onReasoning) onReasoning(reasoning);
          }
          if (p.aragoniteai_tool_result) {
            const tr = `   ✓ ${p.aragoniteai_tool_result.name} complete`;
            reasoning = reasoning ? reasoning + "\n" + tr : tr;
            if (onReasoning) onReasoning(reasoning);
          }
          if (p.aragoniteai_tool) {
            const tt = `🔧 ${p.aragoniteai_tool.name}: ${p.aragoniteai_tool.result?.slice(0, 100) || ""}...`;
            reasoning = reasoning ? reasoning + "\n" + tt : tt;
            if (onReasoning) onReasoning(reasoning);
          }
        } catch {}
      }
    }
  }
  return { text: full, reasoning };
}

export default function ChatInterface({ credits, onCreditsChange }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const sendingRef = useRef(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) setConversations((await res.json()).conversations);
    } catch {}
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId || sendingRef.current) return;
    fetch(`/api/conversations/${activeId}`)
      .then((r) => r.json())
      .then((d) => { setMessages(d.conversation.messages); setTitle(d.conversation.title); })
      .catch(() => {});
  }, [activeId]);

  async function handleNew() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (res.ok) {
        const d = await res.json();
        setConversations((p) => [d.conversation, ...p]);
        setActiveId(d.conversation.id);
        setMessages([]);
        setTitle("New Chat");
      }
    } catch {}
  }

  function handleSelect(id: string) { setActiveId(id); }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((p) => p.filter((c) => c.id !== id));
      if (activeId === id) { setActiveId(null); setMessages([]); setTitle(""); }
    } catch {}
  }

  // Main send — supports compare (multi-model) and pipeline
  async function handleSend(
    models: string[], content: string, webSearch: boolean, deepResearch: boolean, pipeModel?: string
  ) {
    sendingRef.current = true;

    // Use the model the user selected — the toggle bar IS the model choice
    const firstModel = models[0];

    // Auto-create conversation
    let targetId = activeId;
    if (!targetId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" }),
        });
        if (res.ok) {
          const d = await res.json();
          targetId = d.conversation.id;
          setConversations((p) => [d.conversation, ...p]);
          setActiveId(targetId);
          setTitle("New Chat");
        } else return;
      } catch { return; }
    }

    // Smart web search — only search when the query actually needs it
    const actuallyDeep = deepResearch && shouldDeepResearch(content);
    const actuallySearch = webSearch && (shouldSearchWeb(content) || actuallyDeep);
    let searchContext = "";
    const reasoningSteps: string[] = [];
    if (actuallySearch) {
      // Show reasoning placeholder
      const reasoningMsg: Message = { role: "assistant", content: "", model: "research" };
      setMessages((prev) => [...prev, reasoningMsg]);

      const result = await fetchResearch(content, (step) => {
        reasoningSteps.push(step);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: reasoningSteps.map((s) => `  ${s}`).join("\n"),
            model: "research",
          };
          return copy;
        });
      });
      searchContext = result.context;
      setMessages((prev) => prev.filter((m) => m.model !== "research"));
    }
    // Collect reasoning steps for collapsible display
    const reasoning = [...reasoningSteps];
    const fullPrompt = searchContext ? `${content}${searchContext}` : content;

    setLoading(true);

    try {
      if (pipeModel) {
        // === PIPELINE MODE ===
        // Step 1: Model A generates
        const pipeModels = [firstModel, pipeModel];

        // Add user message
        const userMsg: Message = { role: "user", content: content, model: null };
        setMessages((prev) => [...prev, userMsg]);

        // Step 1: first model
        const msgA: Message = {
          role: "pipeline",
          content: "",
          model: firstModel,
          pipeline: pipeModels,
          responses: [{ model: firstModel, content: "" }],
        };
        setMessages((prev) => [...prev, msgA]);

        const { text: contentA, reasoning: rA } = await streamOne(firstModel, fullPrompt, targetId);
        const pipeReasoning = mergeReasoning([...reasoning], rA);

        // Update with model A response
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: contentA,
            responses: [{ model: firstModel, content: contentA }],
          };
          return copy;
        });

        // Step 2: pipe to improver — context-aware
        const reviewPrompt = `Improve the following output. Fix any mistakes, fill in gaps, and make it more thorough and accurate. CRITICAL: keep the SAME format as the original. If it's a list, return a better list. If it's analysis, return better analysis. Only write code if the original output was code.\n\n---\n${contentA}\n---\n\nReturn the improved version (same format, better quality):`;

        const msgB: Message = {
          role: "pipeline",
          content: "",
          model: pipeModel,
          pipeline: pipeModels,
          responses: [
            { model: firstModel, content: contentA },
            { model: pipeModel, content: "" },
          ],
        };
        setMessages((prev) => [...prev, msgB]);

        const { text: contentB, reasoning: rB } = await streamOne(pipeModel, reviewPrompt, targetId);

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: contentB,
            responses: [
              { model: firstModel, content: contentA },
              { model: pipeModel, content: contentB },
            ],
          };
          return copy;
        });

        onCreditsChange();
        loadConversations();

      } else if (models.length >= 2) {
        // === COMPARE MODE ===

        const userMsg: Message = { role: "user", content: content, model: null };
        setMessages((prev) => [...prev, userMsg]);

        const placeholder: Message = {
          role: "assistant",
          content: "",
          model: null,
          responses: models.map((m) => ({ model: m, content: "" })),
          reasoning,
        };
        setMessages((prev) => [...prev, placeholder]);

        // Fire all in parallel
        const promises = models.map((m) =>
          streamOne(m, fullPrompt, targetId).then((r) => ({ model: m, content: r.text }))
        );

        // Stream updates — update as each resolves
        const results: CompareResponse[] = [];
        for (const p of promises) {
          const r = await p;
          results.push(r);
          // Update in-place
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              ...copy[copy.length - 1],
              responses: [...results],
            };
            return copy;
          });
        }

        onCreditsChange();
        loadConversations();

      } else {
        // === SINGLE MODE ===

        const userMsg: Message = { role: "user", content: content, model: null };
        setMessages((prev) => [...prev, userMsg]);

        const assistantMsg: Message = { role: "assistant", content: "", model: firstModel, reasoning };
        setMessages((prev) => [...prev, assistantMsg]);

        const { text: result, reasoning: rSingle } = await streamOne(firstModel, fullPrompt, targetId);

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: result };
          return copy;
        });

        // === DEEP RESEARCH: auto-verify claims with follow-up searches ===
        if (actuallyDeep && result) {
          const verifySteps: string[] = [];

          // Extract brand names from the response using multiple methods
          const namesToCheck = new Set<string>();

          // Method 1: Markdown table rows — | Name | ... |
          const tableRows = result.match(/^\|?\s*\*?\*?([A-Z][a-z]{2,18}(?:AI|ai|OS|fy|ix|ly|ta|th|eo|ra)?(?:\s?[A-Z][a-z]{2,12})?)\*?\*?\s*\|/gm) || [];
          for (const row of tableRows) {
            const cells = row.split("|").map((c) => c.replace(/\*|`/g, "").trim()).filter(Boolean);
            if (cells[0] && cells[0].length > 3 && /^[A-Z]/.test(cells[0])) {
              namesToCheck.add(cells[0]);
            }
          }

          // Method 2: Bolded names **Name**
          const boldMatches = result.match(/\*\*([A-Z][a-z]{2,18}(?:AI|ai|OS|fy|ix|ly|ta|th)?(?:\s?[A-Z][a-z]{2,12})?)\*\*/g) || [];
          for (const m of boldMatches) {
            const name = m.replace(/\*/g, "").trim();
            if (name.length > 3) namesToCheck.add(name);
          }

          // Method 3: Numbered list items: "1. Name" or "1) Name"
          const listMatches = result.match(/(?:^|\n)\s*\d+[\.\)]\s*\*?\*?([A-Z][a-z]{2,18}(?:AI|ai|OS|fy|ix|ly|ta|th)?(?:\s?[A-Z][a-z]{2,12})?)/gm) || [];
          for (const m of listMatches) {
            const name = m.replace(/^\s*\d+[\.\)]\s*\*?\*?/, "").trim();
            if (name.length > 3) namesToCheck.add(name);
          }

          // Method 4: › bullet names
          const bulletMatches = result.match(/›\s*\*?\*?([A-Z][a-z]{2,18}(?:AI|ai|OS|fy|ix|ly|ta|th)?(?:\s?[A-Z][a-z]{2,12})?)/gm) || [];
          for (const m of bulletMatches) {
            const name = m.replace(/^›\s*\*?\*?/, "").trim();
            if (name.length > 3) namesToCheck.add(name);
          }

          // Method 5: Backtick-wrapped and .ai domains
          const tickMatches = result.match(/`([A-Z][a-z]{2,18}(?:AI|ai)?(?:\s?[A-Z][a-z]{2,12})?)`/g) || [];
          for (const m of tickMatches) namesToCheck.add(m.replace(/`/g, "").trim());

          const dotAiMatches = result.match(/\b([a-z]{3,14})\.ai\b/gi) || [];
          for (const m of dotAiMatches) namesToCheck.add(m.replace(/\.ai/i, ""));

          // Filter out non-brand words and common headers
          const stopWords = new Set([
            "Based", "Here", "Using", "Generated", "Startup", "Names", "From", "This",
            "That", "There", "Their", "These", "About", "After", "Again", "Important",
            "Summary", "Method", "Source", "Domain", "Check", "Search", "Result",
            "Next", "Step", "Note", "Final", "First", "Second", "Third",
            "Name", "Style", "Vibe", "Why", "How", "Example", "Like", "Such",
            "SynthosAI", "VoxelAI", "CogniFlow", // filter false positives from headers
          ]);
          for (const sw of stopWords) namesToCheck.delete(sw);

          if (namesToCheck.size > 0) {
            // Update reasoning with verification step
            const items = [...namesToCheck].slice(0, 8);
            verifySteps.push(`verifying ${items.length} names/claims...`);

            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                reasoning: [...reasoning, ...verifySteps],
              };
              return copy;
            });

            // Run aggressive verification searches
            const results: { name: string; available: boolean; evidence: string; titles: string }[] = [];
            for (let i = 0; i < items.length; i += 2) {
              const batch = items.slice(i, i + 2);
              const batchResults = await Promise.all(
                batch.map(async (name) => {
                  try {
                    // Aggressive search: check if name exists as a company
                    const q = `"${name}" startup OR company OR SaaS OR .ai OR .com`;
                    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
                    if (!r.ok) return { name, available: true, evidence: "", titles: "" };
                    const d = await r.json();
                    const titles = (d.results || []).slice(0, 5).map((s: { title: string }) => s.title).join(" | ");
                    const snippets = (d.results || []).slice(0, 5).map((s: { snippet: string }) => s.snippet).join(" ");

                    // Check if any search result title looks like an existing company
                    const companyIndicators = /(is an?|platform|company|startup|product|tool|app|software|solution|service|customer|pricing|features|team|about us|blog)/i;
                    const hasCompanyIndicators = companyIndicators.test(titles + " " + snippets);
                    const namePattern = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
                    const nameMentions = (titles + snippets).match(namePattern);
                    const mentionCount = nameMentions ? nameMentions.length : 0;

                    // Available = no company-like pages mentioning this name
                    const available = !hasCompanyIndicators || mentionCount <= 2;
                    return { name, available, evidence: snippets.slice(0, 300), titles: titles.slice(0, 300) };
                  } catch {
                    return { name, available: true, evidence: "", titles: "" };
                  }
                })
              );
              results.push(...batchResults);
              verifySteps.push(`verified ${Math.min(i + 2, items.length)}/${items.length}...`);
            }

            // Build definitive verification context
            const availableNames = results.filter((r) => r.available).map((r) => r.name);
            const takenNames = results.filter((r) => !r.available);

            const verifiedCtx =
              `DEFINITIVE VERIFICATION RESULTS (live web search):\n\n` +
              `✅ LIKELY AVAILABLE (no existing company found):\n` +
              (availableNames.length > 0 ? availableNames.map((n) => `- ${n}`).join("\n") : "- none") +
              `\n\n❌ TAKEN (existing company/product found):\n` +
              (takenNames.length > 0
                ? takenNames.map((r) => `- ${r.name}: ${r.titles.slice(0, 150)}`).join("\n")
                : "- none") +
              `\n\nEVIDENCE FROM SEARCHES:\n` +
              results.map((r) => `${r.available ? "✅" : "❌"} ${r.name}: ${r.titles || "no company found"}`).join("\n");

            const verificationPrompt = `WEB SEARCH VERIFICATION COMPLETE. These results come from LIVE web searches, not your training data.

${verifiedCtx}

ORIGINAL LIST YOU GENERATED:
${result}

TASK: Rewrite your response using ONLY these verified results. You MUST:
1. List each name with ✅ (available), ❌ (taken), or ⚠️ (unclear) based on the evidence ABOVE — not your training data.
2. For taken names: state EXACTLY what existing company/product was found.
3. For available names: say they appear free based on web searches.
4. Give a ranked top-5 of the best available names.
5. DO NOT say "I can't check" or "you should verify yourself." The verification is already done above.
6. DO NOT hedge. These results are from live searches. Report them.`;

            verifySteps.push(`synthesizing verified answer...`);

            // Second model pass for verified synthesis
            const { text: refinedResult, reasoning: rRefined } = await streamOne(firstModel, verificationPrompt, targetId);

            verifySteps.push(`${results.filter((r) => r.available).length}/${results.length} names available ✓`);

            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                content: refinedResult,
                reasoning: [...reasoning, ...verifySteps],
              };
              return copy;
            });
          }
        }

        onCreditsChange();
        loadConversations();
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          content: `Error: ${(err as Error).message}`,
        };
        return copy;
      });
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }

  return (
    <div className="d-flex" style={{ height: "calc(100vh - 56px)" }}>
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <ChatWindow messages={messages} title={title} />
        <ChatInput onSend={handleSend} loading={loading} credits={credits} />
      </div>
    </div>
  );
}
