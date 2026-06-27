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
    <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
      {/* Messages */}
      <div className="flex-grow-1 overflow-auto p-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="d-flex align-items-center justify-content-center h-100" style={{ color: "var(--text-muted)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "4px" }}>
                {title || "New Chat"}
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                Select a model and send a message to get started.
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === "pipeline" && msg.responses && msg.pipeline) {
            return <PipelineMessage key={i} msg={msg} />;
          }
          if (msg.responses && msg.responses.length >= 2) {
            return <CompareMessage key={i} msg={msg} />;
          }
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
    <div className="mb-3" style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
      <div className="d-flex" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        {msg.responses!.map((r, i) => (
          <button
            key={r.model}
            onClick={() => setActiveTab(i)}
            style={{
              background: i === activeTab ? "var(--bg-elevated)" : "transparent",
              border: "none",
              borderBottom: i === activeTab ? "2px solid var(--brand)" : "2px solid transparent",
              color: i === activeTab ? "var(--text-primary)" : "var(--text-muted)",
              padding: "8px 14px",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: i === activeTab ? 500 : 400,
            }}
          >
            {r.model.replace("claude-", "").replace("deepseek-", "ds-")}
          </button>
        ))}
        <div className="ms-auto pe-3 d-flex align-items-center">
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {msg.responses!.length}-way compare
          </span>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "8px" }}>
          {msg.responses![activeTab].model}
        </div>
        {msg.responses![activeTab].content ? (
          <MarkdownRenderer content={msg.responses![activeTab].content} />
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Waiting...</span>
        )}
      </div>
    </div>
  );
}

function PipelineMessage({ msg }: { msg: Message }) {
  return (
    <div className="mb-3" style={{ border: "1px solid var(--brand-subtle)", borderRadius: "8px", overflow: "hidden" }}>
      <div
        className="d-flex align-items-center px-3 py-2"
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          Pipeline:{" "}
          {msg.pipeline!.map((m, i) => (
            <span key={m}>
              <span style={{ fontWeight: 500 }}>{m.replace("claude-", "").replace("deepseek-", "ds-")}</span>
              {i < msg.pipeline!.length - 1 && <span style={{ color: "var(--text-muted)" }}> → </span>}
            </span>
          ))}
        </span>
      </div>

      <div style={{ padding: "8px 16px" }}>
        {msg.responses!.map((r, i) => (
          <div key={r.model} style={{ marginBottom: i < msg.responses!.length - 1 ? "12px" : 0 }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              {r.model.replace("claude-", "").replace("deepseek-", "ds-")} {i === 0 ? "(draft)" : "(improved)"}
            </div>
            {r.content ? (
              <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: "12px" }}>
                <MarkdownRenderer content={r.content} />
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", paddingLeft: "12px" }}>Waiting...</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
