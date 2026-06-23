"use client";

import { useState } from "react";

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const elements = parseContent(content);
  return <div className="markdown-body">{elements}</div>;
}

function parseContent(text: string): React.ReactNode[] {
  // Split on code blocks: ```lang\n...\n```
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts
    .filter(Boolean)
    .map((part, idx) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        return <CodeBlock key={idx} raw={part} />;
      }
      return <TextBlock key={idx} text={part} />;
    });
}

function CodeBlock({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);

  // Extract language and code
  const inner = raw.slice(3, -3); // remove outer ```
  const nl = inner.indexOf("\n");
  const lang = nl > 0 ? inner.slice(0, nl).trim() : "";
  const code = nl > 0 ? inner.slice(nl + 1) : inner;

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "6px",
        margin: "10px 0",
        overflow: "hidden",
      }}
    >
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.75rem",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.3)" }}>{lang || "code"}</span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
            border: copied ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.1)",
            color: copied ? "#22c55e" : "rgba(255,255,255,0.5)",
            padding: "2px 10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "12px 16px",
          overflow: "auto",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: "0.82rem",
          color: "rgba(255,255,255,0.75)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.5,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  // Process inline elements within a text block
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line → spacing
    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "6px" }} />);
      continue;
    }

    // Header: ### or ## or #
    if (/^#{1,3}\s/.test(line)) {
      const match = line.match(/^(#{1,3})\s(.+)/);
      if (match) {
        const sizes: Record<string, string> = { "#": "1.5em", "##": "1.2em", "###": "1.05em" };
        elements.push(
          <div
            key={i}
            style={{
              fontWeight: 700,
              fontSize: sizes[match[1]] || "1em",
              marginTop: match[1] === "#" ? "14px" : "8px",
              marginBottom: "4px",
              color: "#e4e4e7",
            }}
          >
            {renderInline(match[2])}
          </div>
        );
        continue;
      }
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(
        <hr key={i} style={{ borderColor: "rgba(255,255,255,0.08)", margin: "10px 0" }} />
      );
      continue;
    }

    // Unordered list: - or *
    if (/^[\-\*]\s/.test(line)) {
      elements.push(
        <div key={i} style={{ paddingLeft: "16px", marginBottom: "2px" }}>
          <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>›</span>
          {renderInline(line.slice(2))}
        </div>
      );
      continue;
    }

    // Numbered list: 1. 2. etc
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+\.)\s/)?.[1] || "";
      const rest = line.slice(num.length + 1);
      elements.push(
        <div key={i} style={{ paddingLeft: "8px", marginBottom: "2px" }}>
          <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>{num}</span>
          {renderInline(rest)}
        </div>
      );
      continue;
    }

    // Normal text line
    elements.push(<div key={i}>{renderInline(line)}</div>);
  }

  return <>{elements}</>;
}

// Inline: bold, italic, code, links
function renderInline(text: string): React.ReactNode {
  // Split and process tokens
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|https?:\/\/[^\s\]\)>]+)/g);

  return (
    <>
      {tokens.map((token, i) => {
        // Bold **...**
        if (token.startsWith("**") && token.endsWith("**")) {
          return <strong key={i} style={{ color: "#e4e4e7" }}>{token.slice(2, -2)}</strong>;
        }
        // Italic *...*
        if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
          return <em key={i} style={{ color: "rgba(255,255,255,0.6)" }}>{token.slice(1, -1)}</em>;
        }
        // Inline code `...`
        if (token.startsWith("`") && token.endsWith("`")) {
          return (
            <code
              key={i}
              style={{
                background: "rgba(255,255,255,0.06)",
                padding: "2px 5px",
                borderRadius: "3px",
                fontSize: "0.85em",
                fontFamily: "'JetBrains Mono', monospace",
                color: "#e4e4e7",
              }}
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        // URL
        if (/^https?:\/\//.test(token)) {
          return (
            <a
              key={i}
              href={token}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--brand-cyan)", textDecoration: "underline" }}
            >
              {token.length > 50 ? token.slice(0, 47) + "..." : token}
            </a>
          );
        }
        // Plain text
        return <span key={i}>{token}</span>;
      })}
    </>
  );
}
