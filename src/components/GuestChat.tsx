"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import Link from "next/link";
import { Button } from "react-bootstrap";

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
      const saved = localStorage.getItem("aragoniteai_guest_messages");
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
      localStorage.setItem("aragoniteai_guest_messages", JSON.stringify(msgs.slice(-50))); // keep last 50
    } catch {}
  }

  async function handleSend(models: string[], content: string, webSearch: boolean, deepResearch: boolean, pipeModel?: string) {
    if (msgCount >= MAX_GUEST_MSGS) return; // hard cutoff
    const model = models[0];

    // Deep research if web search enabled
    let searchContext = "";
    if (webSearch) {
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
    const promptWithSearch = searchContext ? content + searchContext : content;
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
      {/* Banner for guest mode */}
      <div
        className="text-center py-2 px-3"
        style={{
          background: "rgba(139, 92, 246, 0.06)",
          borderBottom: "1px solid rgba(139, 92, 246, 0.12)",
          fontSize: "0.85rem",
          fontFamily: "'JetBrains Mono', monospace",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.3)" }}>guest@aragoniteai:~$</span>{" "}
        You&apos;re trying AragoniteAI — messages aren&apos;t saved.{" "}
        <Link href="/signup" style={{ color: "var(--brand-purple)" }}>
          Create a free account →
        </Link>
      </div>

      {/* Terminal title bar */}
      <div
        className="d-flex align-items-center px-3 py-2"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <span
          className="d-inline-block rounded-circle me-2"
          style={{ width: "10px", height: "10px", background: "#ef4444" }}
        />
        <span
          className="d-inline-block rounded-circle me-2"
          style={{ width: "10px", height: "10px", background: "#eab308" }}
        />
        <span
          className="d-inline-block rounded-circle me-3"
          style={{ width: "10px", height: "10px", background: "#22c55e" }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          guest@aragoniteai — bash — 80×24
        </span>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-auto p-4" style={{ minHeight: 0, background: "#0a0a0f" }}>
        {messages.length === 0 && (
          <div
            className="d-flex align-items-center justify-content-center h-100"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.12)" }}>◆</div>
              <div style={{ color: "rgba(255,255,255,0.18)" }}>AragoniteAI Terminal</div>
              <div style={{ color: "rgba(255,255,255,0.1)", marginTop: "4px" }}>
                Every model. One terminal. Lowest price.
              </div>
              <div style={{ color: "rgba(255,255,255,0.2)", marginTop: "12px" }}>
                $ <span style={{ color: "#22c55e" }}>▋</span>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} model={msg.model} />
        ))}

        {/* Signup prompt after a few messages */}
        {showSignup && (
          <div
            className="text-center p-4 my-3 rounded"
            style={{
              background: "rgba(139, 92, 246, 0.08)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            <div className="fw-bold mb-2" style={{ color: "var(--brand-purple)" }}>
              ✨ Like what you see?
            </div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginBottom: "12px" }}>
              Create a free account to save conversations, get your own API key, and access all models.
            </p>
            <Link href="/signup" className="btn btn-primary">
              Create Free Account →
            </Link>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", marginTop: "6px" }}>
              $1.00 free credits included — no card required
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
