"use client";

import { useState, useRef, useEffect } from "react";
import { MODELS } from "@/lib/pricing";

const QUICK_MODELS = ["deepseek-chat", "deepseek-reasoner", "claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-8", "llama-4-maverick"];
const GUEST_MODELS = ["deepseek-chat", "deepseek-reasoner"];

interface Props {
  onSend: (models: string[], content: string, webSearch: boolean, deepResearch: boolean, pipeModel?: string) => Promise<void>;
  loading: boolean;
  credits: number | null;
  guestMode?: boolean;
  guestMsgCount?: number;
}

export default function ChatInput({ onSend, loading, credits, guestMode, guestMsgCount }: Props) {
  const visibleModels = guestMode
    ? MODELS.filter((m) => m.provider === "deepseek")
    : MODELS;
  const [selected, setSelected] = useState<string[]>(["deepseek-chat"]);
  const MAX_GUEST = 5;
  const guestBlocked = guestMode && (guestMsgCount ?? 0) >= MAX_GUEST;
  const [pipeModel, setPipeModel] = useState<string | null>(null);
  const [showPipe, setShowPipe] = useState(false);
  const [webSearch, setWebSearch] = useState(true);
  const [deepResearch, setDeepResearch] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isOutOfCredits = credits != null && credits <= 0;

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  function toggleModel(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  }

  function togglePipe() {
    if (showPipe) {
      setPipeModel(null);
      setShowPipe(false);
    } else {
      setShowPipe(true);
      setPipeModel(pipeModel || "deepseek-reasoner");
    }
  }

  async function handleSend() {
    if (!input.trim() || loading || isOutOfCredits) return;
    const content = input.trim();
    setInput("");
    await onSend(selected, content, webSearch, deepResearch, pipeModel || undefined);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isCompare = selected.length >= 2;
  const mode = showPipe ? "pipe" : isCompare ? "compare" : "single";

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Guest limit warning */}
      {guestBlocked && (
        <div
          className="px-3 py-2 text-center"
          style={{
            background: "rgba(139, 92, 246, 0.1)",
            borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
            color: "var(--brand-purple)",
            fontSize: "0.85rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          You&apos;ve used {MAX_GUEST}/{MAX_GUEST} free messages.{" "}
          <a href="/signup" style={{ color: "var(--brand-purple)", fontWeight: 700 }}>
            Create a free account →
          </a>{" "}
          for unlimited access to all models.
        </div>
      )}

      {/* Credit warning */}
      {!guestMode && isOutOfCredits && (
        <div
          className="px-3 py-1 text-center"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#fca5a5",
            fontSize: "0.8rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          !insufficient credits — <a href="/dashboard/billing" style={{ color: "#fca5a5" }}>/billing</a>
        </div>
      )}

      {/* Model toggles — terminal style */}
      <div
        className="d-flex align-items-center gap-2 px-3 pt-2 flex-wrap"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem" }}
      >
        {(guestMode ? GUEST_MODELS : QUICK_MODELS).map((id) => {
          const m = MODELS.find((x) => x.id === id);
          if (!m) return null;
          const isSel = selected.includes(id);
          const ctxLabel = m.contextWindow >= 1_000_000
            ? `${(m.contextWindow / 1_000_000).toFixed(0)}M`
            : `${(m.contextWindow / 1000).toFixed(0)}k`;
          return (
            <button
              key={id}
              onClick={() => !m.comingSoon && toggleModel(id)}
              disabled={loading || m.comingSoon}
              title={`${m.name} · ${ctxLabel} ctx · ${m.bedrock ? "AWS credits ✓" : ""}${m.comingSoon ? " · coming soon" : ""}`}
              style={{
                background: isSel ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                border: isSel ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: m.comingSoon ? "rgba(255,255,255,0.15)" : isSel ? "#22c55e" : "rgba(255,255,255,0.4)",
                padding: "2px 8px",
                borderRadius: "3px",
                cursor: m.comingSoon ? "default" : "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.7rem",
                transition: "all 0.15s",
                opacity: m.comingSoon ? 0.5 : 1,
              }}
            >
              {m.comingSoon ? "○" : isSel ? "☑" : "☐"} {m.name}
              {m.bedrock ? <span style={{ color: "rgba(255,165,0,0.6)", fontSize: "0.6rem", marginLeft: "2px" }}>⚡</span> : null}
              {m.comingSoon ? <span style={{ fontSize: "0.6rem", marginLeft: "4px" }}>soon</span> : null}
            </button>
          );
        })}

        {/* Web search toggle */}
        <button
          onClick={() => { setWebSearch(!webSearch); if (!webSearch) setDeepResearch(false); }}
          disabled={loading}
          title="Search the web and feed results to the model"
          style={{
            background: webSearch ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.03)",
            border: webSearch ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: webSearch ? "var(--brand-cyan)" : "rgba(255,255,255,0.3)",
            padding: "2px 8px",
            borderRadius: "3px",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.7rem",
          }}
        >
          {webSearch ? "🌐 ✓" : "🌐"}
        </button>

        {/* Deep research toggle — only available when web is on */}
        {webSearch && (
          <button
            onClick={() => setDeepResearch(!deepResearch)}
            disabled={loading}
            title="Deep research: auto-verify claims, fact-check outputs, iteratively search"
            style={{
              background: deepResearch ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
              border: deepResearch ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: deepResearch ? "var(--brand-purple)" : "rgba(255,255,255,0.3)",
              padding: "2px 8px",
              borderRadius: "3px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
            }}
          >
            {deepResearch ? "🔬 ✓" : "🔬"}
          </button>
        )}

        {/* Pipe button */}
        <button
          onClick={togglePipe}
          disabled={loading}
          title="Pipe: send output to another model for review"
          style={{
            background: showPipe ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
            border: showPipe ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: showPipe ? "var(--brand-purple)" : "rgba(255,255,255,0.3)",
            padding: "2px 8px",
            borderRadius: "3px",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.7rem",
          }}
        >
          {showPipe ? "|> ✓" : "|>"}
        </button>

        {/* Pipe target selector */}
        {showPipe && (
          <select
            className="form-select"
            style={{
              width: "auto",
              background: "rgba(0,0,0,0.4)",
              color: "var(--brand-purple)",
              border: "1px solid rgba(139,92,246,0.3)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
              padding: "2px 6px",
            }}
            value={pipeModel || ""}
            onChange={(e) => setPipeModel(e.target.value || null)}
          >
            {visibleModels.filter((m) => !selected.includes(m.id)).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {/* Mode indicator */}
        <span style={{ color: "rgba(255,255,255,0.2)", marginLeft: "auto", flexShrink: 0 }}>
          {mode === "compare" ? `// ${selected.length}-way compare` : mode === "pipe" ? "// pipeline" : ""}
        </span>
      </div>

      {/* Input row */}
      <div className="d-flex align-items-center p-3" style={{ gap: "8px" }}>
        <div
          className="d-flex align-items-center flex-grow-1"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: "0.9rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "4px",
            padding: "6px 10px",
          }}
        >
          <span style={{ color: "#22c55e", marginRight: "6px", flexShrink: 0 }}>
            {showPipe ? "|" : "$"}
          </span>
          <input
            ref={inputRef}
            type="text"
            className="border-0 bg-transparent text-light flex-grow-1"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              outline: "none",
              fontSize: "0.9rem",
            }}
            placeholder={
              guestBlocked ? "limit reached — sign up to continue..." :
              isOutOfCredits ? "add credits..." :
              loading ? "waiting..." :
              showPipe ? "pipe to review..." :
              isCompare ? "compare prompt..." :
              "type a message..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || isOutOfCredits}
            autoFocus
          />
        </div>

        {/* Credits */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            color: isOutOfCredits ? "#ef4444" : "rgba(255,255,255,0.3)",
            flexShrink: 0,
          }}
        >
          {guestMode ? `${guestMsgCount ?? 0}/${MAX_GUEST}` : credits != null ? `$${credits.toFixed(4)}` : "—"}
        </span>
      </div>
    </div>
  );
}
