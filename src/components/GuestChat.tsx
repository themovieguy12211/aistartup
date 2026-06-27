"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import Link from "next/link";
import { Button } from "react-bootstrap";
import { shouldSearchWeb } from "@/lib/query-classifier";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string | null;
}

export default function GuestChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [showSignup, setShowSignup] = useState(false);
  const MAX_GUEST_MSGS = 5;
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load guest messages from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dagrai_guest_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        setMsgCount(parsed.filter((m: Message) => m.role === "user").length);
        if (parsed.filter((m: Message) => m.role === "user").length >= 3) {
          setShowSignup(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function saveMessages(msgs: Message[]) {
    try {
      localStorage.setItem("dagrai_guest_messages", JSON.stringify(msgs.slice(-50))); // keep last 50
    } catch {}
  }

  async function handleSend(models: string[], content: string, webSearch: boolean, deepResearch: boolean, pipeModel?: string) {
    if (msgCount >= MAX_GUEST_MSGS) return; // hard cutoff
    const model = models[0];

    // Deep research if web search enabled — but skip for casual queries
    let searchContext = "";
    if (webSearch && shouldSearchWeb(content)) {
      try {
        const res = await fetch(`/api/research?q=${encodeURIComponent(content)}`);
        if (res.ok) {
          const data = await res.json();
          const parts: string[] = [];

          if (data.directUrls?.length) {
            parts.push("\n\n[Directly fetched pages:\n" +
              data.directUrls.map((d: { title: string; url: string; content: string }) =>
                `## ${d.title}\nURL: ${d.url}\n\n${d.content.slice(0, 5000)}`).join("\n") + "\n]");
          }
          if (data.searchResults?.length) {
            parts.push("\n\n[Web results:\n" +
              data.searchResults.map((r: { title: string; url: string; snippet: string }) =>
                `- ${r.title}\n  ${r.url}\n  ${r.snippet}`).join("\n\n") + "\n]");
          }
          if (data.fetchedPages?.length) {
            parts.push("\n\n[Full page content:\n" +
              data.fetchedPages.map((fp: { title: string; url: string; content: string }) =>
                `## ${fp.title}\nURL: ${fp.url}\n\n${fp.content.slice(0, 3000)}`).join("\n") + "\n]");
          }

          if (parts.length) {
            searchContext = parts.join("\n") +
              "\nUse these sources to provide a thorough answer. Cite them where relevant.";
          }
        }
      } catch {}
    }
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      model: null,
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveMessages(updated);
    setLoading(true);

    const newCount = msgCount + 1;
    setMsgCount(newCount);

    // Show signup prompt after 3 messages
    if (newCount >= 2) {
      setShowSignup(true);
    }

    try {
      const res = await fetch("/api/playground/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: updated.map((m, idx) => ({
            role: m.role,
            content: idx === updated.length - 1 && searchContext ? m.content + searchContext : m.content,
          })),
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Guest limit reached. Create a free account to continue.");
        }
        throw new Error("API error");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let fullContent = "";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        model,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.choices?.[0]?.delta?.content) {
                fullContent += parsed.choices[0].delta.content;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    ...copy[copy.length - 1],
                    content: fullContent,
                  };
                  return copy;
                });
              }
            } catch {}
          }
        }
      }

      // Save final state
      setMessages((prev) => {
        saveMessages(prev);
        return prev;
      });
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
    }
  }

  return (
    <div className="d-flex flex-column" style={{ height: "calc(100vh - 56px)" }}>
      {/* Guest banner */}
      <div
        className="text-center py-2 px-3"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
        }}
      >
        You&apos;re trying DagrAI — messages aren&apos;t saved.{" "}
        <Link href="/signup" style={{ color: "var(--brand)" }}>
          Create a free account
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-auto p-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div
            className="d-flex align-items-center justify-content-center h-100"
            style={{ color: "var(--text-muted)" }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                DagrAI
              </div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Every model. One API. Lowest price.
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} model={msg.model} />
        ))}

        {showSignup && (
          <div
            className="text-center p-4 my-3 rounded"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="fw-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Like what you see?
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "12px" }}>
              Create a free account to save conversations, get your own API key, and access all models.
            </p>
            <Link href="/signup" style={{ background: "var(--brand)", color: "#fff", borderRadius: "6px", padding: "8px 20px", fontWeight: 500, textDecoration: "none", display: "inline-block" }}>
              Create Free Account
            </Link>
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "8px" }}>
              50,000 free tokens every day — no card required
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} loading={loading} credits={null} guestMode guestMsgCount={msgCount} />
    </div>
  );
}
