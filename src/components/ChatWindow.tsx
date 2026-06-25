"use client";

import { useRef, useEffect, useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import MarkdownRenderer from "@/components/MarkdownRenderer";

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
  reasoning?: string[];
}

interface Props {
  messages: Message[];
  title?: string;
}

export default function ChatWindow({ messages, title }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, background: "#0a0a0f" }}>
      {/* Terminal title bar */}
      <div
        className="d-flex align-items-center px-3 py-2"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <span className="d-inline-block rounded-circle me-2" style={{ width: "10px", height: "10px", background: "#ef4444" }} />
        <span className="d-inline-block rounded-circle me-2" style={{ width: "10px", height: "10px", background: "#eab308" }} />
        <span className="d-inline-block rounded-circle me-3" style={{ width: "10px", height: "10px", background: "#22c55e" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>
          {title || "dagrai ~ chat"} — bash — 80×24
        </span>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-auto p-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="d-flex align-items-center justify-content-center h-100" style={{ color: "rgba(255,255,255,0.2)" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.12)" }}>◆</div>
              <div style={{ color: "rgba(255,255,255,0.15)" }}>DagrAI Terminal v1.0</div>
              <div style={{ color: "rgba(255,255,255,0.1)" }}>Select models above. Use |&gt; for pipeline.</div>
              <div style={{ color: "rgba(255,255,255,0.2)", marginTop: "12px" }}>
                $ <span style={{ color: "#22c55e" }}>▋</span>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          // Pipeline message
          if (msg.role === "pipeline" && msg.responses && msg.pipeline) {
            return <PipelineMessage key={i} msg={msg} />;
          }

          // Compare message (multiple responses)
          if (msg.responses && msg.responses.length >= 2) {
            return <CompareMessage key={i} msg={msg} />;
          }

          // Normal message
          return (
            <ChatMessage
              key={msg.id || i}
              role={msg.role}
              content={msg.content}
              model={msg.model}
              cost={msg.cost}
              reasoning={msg.reasoning}
            />
          );
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function CompareMessage({ msg }: { msg: Message }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="mb-3" style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", overflow: "hidden" }}>
      {/* Tabs */}
      <div className="d-flex" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {msg.responses!.map((r, i) => (
          <button
            key={r.model}
            onClick={() => setActiveTab(i)}
            style={{
              background: i === activeTab ? "rgba(139,92,246,0.15)" : "transparent",
              border: "none",
              borderBottom: i === activeTab ? "2px solid var(--brand-purple)" : "2px solid transparent",
              color: i === activeTab ? "#e4e4e7" : "rgba(255,255,255,0.4)",
              padding: "6px 14px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.75rem",
              cursor: "pointer",
              transition: "all 0.1s",
            }}
          >
            {r.model.replace("claude-", "").replace("deepseek-", "ds-")}
            {r.content ? " ✓" : " ..."}
          </button>
        ))}
        <div className="ms-auto pe-2 d-flex align-items-center">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.2)" }}>
            {msg.responses!.length}-way compare
          </span>
        </div>
      </div>

      {/* Active tab content */}
      <div style={{ padding: "12px 16px", borderLeft: "2px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginBottom: "6px" }}>
          [{msg.responses![activeTab].model}]
        </div>
        {msg.responses![activeTab].content ? (
          <MarkdownRenderer content={msg.responses![activeTab].content} />
        ) : (
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.85rem" }}>waiting...</span>
        )}
      </div>
    </div>
  );
}

function PipelineMessage({ msg }: { msg: Message }) {
  return (
    <div className="mb-3" style={{ border: "1px solid rgba(139,92,246,0.15)", borderRadius: "6px", overflow: "hidden" }}>
      {/* Pipeline header */}
      <div
        className="d-flex align-items-center px-3 py-2"
        style={{ background: "rgba(139,92,246,0.06)", borderBottom: "1px solid rgba(139,92,246,0.1)" }}
      >
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "var(--brand-purple)" }}>
          pipeline:{" "}
          {msg.pipeline!.map((m, i) => (
            <span key={m}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{m.replace("claude-", "").replace("deepseek-", "ds-")}</span>
              {i < msg.pipeline!.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)" }}> → </span>}
            </span>
          ))}
        </span>
      </div>

      {/* Responses in chain */}
      <div style={{ padding: "8px 16px" }}>
        {msg.responses!.map((r, i) => (
          <div key={r.model} style={{ marginBottom: i < msg.responses!.length - 1 ? "12px" : 0 }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.25)",
                marginBottom: "4px",
                padding: "2px 8px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "3px",
                display: "inline-block",
              }}
            >
              {i === 0 ? "── " : "── "}
              {r.model.replace("claude-", "").replace("deepseek-", "ds-")}
              {i === 0 ? " (draft)" : " (improve)"}
            </div>
            {r.content ? (
              <div style={{ borderLeft: "2px solid rgba(255,255,255,0.08)", paddingLeft: "12px" }}>
                <MarkdownRenderer content={r.content} />
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.85rem", paddingLeft: "12px" }}>waiting...</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
