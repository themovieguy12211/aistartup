"use client";

import { useState } from "react";
import { Spinner } from "react-bootstrap";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  role: "user" | "assistant" | "pipeline" | "research";
  content: string;
  model?: string | null;
  cost?: number | null;
  reasoning?: string[];
}

export default function ChatMessage({ role, content, model, cost, reasoning }: Props) {
  const [showReasoning, setShowReasoning] = useState(false);

  if (role === "research") {
    return (
      <div className="mb-2" style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
        {content.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="mb-3 d-flex justify-content-end">
        <div
          className="chat-message user"
          style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      {/* Collapsible reasoning */}
      {reasoning && reasoning.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: "0.78rem",
              borderRadius: "6px",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            {showReasoning ? "Hide" : "Show"} thought process ({reasoning.length} step{reasoning.length !== 1 ? "s" : ""})
          </button>
          {showReasoning && (
            <div
              style={{
                marginTop: "6px",
                padding: "10px 14px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                color: "var(--text-muted)",
                fontSize: "0.82rem",
                lineHeight: 1.7,
              }}
            >
              {reasoning.map((step, i) => (
                <div key={i}>{step}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Response content */}
      {!content ? (
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <Spinner size="sm" style={{ color: "var(--brand)" }} /> Thinking...
        </div>
      ) : (
        <div className="chat-message assistant" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
          <MarkdownRenderer content={content} />
          {model && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
              {model}{cost != null ? ` · $${cost.toFixed(6)}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
