"use client";

import { useState, useRef, useEffect } from "react";
import { MODELS } from "@/lib/pricing";

const QUICK_MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "deepseek-v4-pro", "deepseek-v4-flash", "deepseek-reasoner", "deepseek-chat"];
const GUEST_MODELS = ["claude-sonnet-4-6", "deepseek-chat"];

interface Props {
  onSend: (models: string[], content: string, webSearch: boolean, deepResearch: boolean, pipeModel?: string) => Promise<void>;
  loading: boolean;
  credits: number | null;
  guestMode?: boolean;
  guestMsgCount?: number;
  onCancel?: () => void;
}

export default function ChatInput({ onSend, loading, credits, guestMode, guestMsgCount, onCancel }: Props) {
  const visibleModels = guestMode
    ? MODELS.filter((m) => m.provider === "deepseek")
    : MODELS;
  const [selected, setSelected] = useState<string[]>(["claude-sonnet-4-6"]);
  const MAX_GUEST = 5;
  const guestBlocked = guestMode && (guestMsgCount ?? 0) >= MAX_GUEST;
  const [pipeModel, setPipeModel] = useState<string | null>(null);
  const [showPipe, setShowPipe] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isOutOfCredits = credits != null && credits <= 0;

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  function toggleModel(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
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
      setPipeModel(pipeModel || "claude-opus-4-6");
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
    <div style={{ borderTop: "1px solid var(--border)" }}>
      {/* Guest limit warning */}
      {guestBlocked && (
        <div
          className="px-3 py-2 text-center"
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
          }}
        >
          You&apos;ve used {MAX_GUEST}/{MAX_GUEST} free messages.{" "}
          <a href="/signup" style={{ color: "var(--brand)", fontWeight: 600 }}>
            Create a free account
          </a>{" "}
          for 50,000 free tokens every day.
        </div>
      )}

      {/* Credit warning */}
      {!guestMode && isOutOfCredits && (
        <div
          className="px-3 py-1 text-center"
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            fontSize: "0.82rem",
          }}
        >
          Out of credits — <a href="/dashboard/billing" style={{ color: "var(--brand)" }}>add credits</a> or wait for tomorrow&apos;s free tokens.
        </div>
      )}

      {/* Model toggles */}
      <div className="d-flex align-items-center gap-1 px-3 pt-2 flex-wrap" style={{ fontSize: "0.78rem" }}>
        {(guestMode ? GUEST_MODELS : QUICK_MODELS).map((id) => {
          const m = MODELS.find((x) => x.id === id);
          if (!m) return null;
          const isSel = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => !m.comingSoon && toggleModel(id)}
              disabled={loading || m.comingSoon}
              title={`${m.name} · ${m.contextWindow >= 1_000_000 ? `${(m.contextWindow / 1_000_000).toFixed(0)}M` : `${(m.contextWindow / 1000).toFixed(0)}k`} ctx`}
              style={{
                background: isSel ? "var(--brand-subtle)" : "transparent",
                border: isSel ? "1px solid var(--brand)" : "1px solid var(--border)",
                color: m.comingSoon ? "var(--text-muted)" : isSel ? "var(--brand)" : "var(--text-secondary)",
                padding: "2px 8px",
                borderRadius: "4px",
                cursor: m.comingSoon ? "default" : "pointer",
                fontSize: "0.75rem",
                transition: "all 0.1s",
                opacity: m.comingSoon ? 0.4 : 1,
              }}
            >
              {m.name}
              {m.comingSoon ? " (soon)" : ""}
            </button>
          );
        })}

        {/* Web search */}
        <button
          onClick={() => { setWebSearch(!webSearch); if (!webSearch) setDeepResearch(false); }}
          disabled={loading}
          style={{
            background: webSearch ? "var(--bg-elevated)" : "transparent",
            border: webSearch ? "1px solid var(--text-secondary)" : "1px solid var(--border)",
            color: webSearch ? "var(--text-primary)" : "var(--text-muted)",
            padding: "2px 8px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          Web
        </button>

        {/* Deep research */}
        {webSearch && (
          <button
            onClick={() => setDeepResearch(!deepResearch)}
            disabled={loading}
            style={{
              background: deepResearch ? "var(--brand-subtle)" : "transparent",
              border: deepResearch ? "1px solid var(--brand)" : "1px solid var(--border)",
              color: deepResearch ? "var(--brand)" : "var(--text-muted)",
              padding: "2px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
          >
            Research
          </button>
        )}

        {/* Refine: one model generates, another improves */}
        <button
          onClick={togglePipe}
          disabled={loading}
          style={{
            background: showPipe ? "var(--brand-subtle)" : "transparent",
            border: showPipe ? "1px solid var(--brand)" : "1px solid var(--border)",
            color: showPipe ? "var(--brand)" : "var(--text-muted)",
            padding: "2px 8px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          Refine
        </button>

        {showPipe && (
          <select
            className="form-select"
            style={{
              width: "auto",
              fontSize: "0.75rem",
              padding: "2px 6px",
            }}
            value={pipeModel || ""}
            onChange={(e) => setPipeModel(e.target.value || null)}
          >
            {visibleModels.filter((m) => m.provider === "anthropic" && !selected.includes(m.id)).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}

        {/* Mode label */}
        {mode !== "single" && (
          <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginLeft: "auto" }}>
            {mode === "compare" ? `${selected.length}-way compare` : "refine"}
          </span>
        )}
      </div>

      {/* Input row */}
      <div className="d-flex align-items-center p-3" style={{ gap: "8px" }}>
        <textarea
          ref={inputRef}
          className="form-control flex-grow-1"
          style={{
            resize: "none",
            fontSize: "0.95rem",
            minHeight: "40px",
            maxHeight: "120px",
          }}
          rows={1}
          placeholder={
            guestBlocked ? "Limit reached — sign up to continue..." :
            isOutOfCredits ? "Out of credits — add more to continue..." :
            loading ? "Waiting..." :
            "Type a message..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || isOutOfCredits}
          autoFocus
        />

        {/* Stop button */}
        {loading && onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "0.82rem",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Stop
          </button>
        )}

        {/* Credits display */}
        <span style={{
          fontSize: "0.78rem",
          color: isOutOfCredits ? "var(--text-muted)" : "var(--text-secondary)",
          flexShrink: 0,
          minWidth: guestMode ? "auto" : "70px",
          textAlign: "right",
        }}>
          {guestMode ? `${guestMsgCount ?? 0}/${MAX_GUEST}` : credits != null ? `$${credits.toFixed(4)}` : "—"}
        </span>
      </div>
    </div>
  );
}
