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

  // Live research steps during processing
  if (role === "research") {
    return (
      <div className="mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", marginBottom: "2px" }}>
          $ researching...
        </div>
        {content.split("\n").map((line, i) => (
          <div key={i} style={{ color: "rgba(255,255,255,0.25)" }}>
            {line}
          </div>
        ))}
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="mb-1" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.9rem" }}>
        <span style={{ color: "#22c55e" }}>$</span>{" "}
        <span style={{ color: "#e4e4e7" }}>{content}</span>
      </div>
    );
  }

  return (
    <div className="mb-3" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.9rem" }}>
      {/* Collapsible reasoning */}
      {reasoning && reasoning.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.35)",
              padding: "4px 10px",
              borderRadius: "3px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
            }}
          >
            {showReasoning ? "▼" : "▶"} Thought process ({reasoning.length} step{reasoning.length !== 1 ? "s" : ""})
          </button>
          {showReasoning && (
            <div
              style={{
                marginTop: "4px",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "4px",
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.72rem",
                lineHeight: 1.6,
              }}
            >
              {reasoning.map((step, i) => (
                <div key={i} style={{ color: "rgba(255,255,255,0.25)" }}>
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Response content */}
      {!content ? (
        <div style={{ color: "rgba(255,255,255,0.3)" }}>
          <Spinner size="sm" style={{ color: "var(--brand-purple)" }} /> thinking...
        </div>
      ) : (
        <div
          style={{
            color: "rgba(255,255,255,0.65)",
            wordBreak: "break-word",
            paddingLeft: "12px",
            borderLeft: "2px solid rgba(255,255,255,0.1)",
          }}
        >
          <MarkdownRenderer content={content} />
          {model && (
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", marginTop: "8px" }}>
              [{model}]{cost != null ? ` [$${cost.toFixed(6)}]` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
