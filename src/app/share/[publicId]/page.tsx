"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Spinner } from "react-bootstrap";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface SharedMessage {
  role: string;
  content: string;
  model: string | null;
  createdAt: string;
}

export default function SharedConversationPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [title, setTitle] = useState("");
  const [messages, setMessages] = useState<SharedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/share/${publicId}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((d) => { setTitle(d.title); setMessages(d.messages); })
      .catch(() => setError("This conversation is no longer shared or doesn't exist."))
      .finally(() => setLoading(false));
  }, [publicId]);

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div
        className="d-flex align-items-center justify-content-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
      >
        <div>
          <Link href="/" style={{ fontWeight: 600, color: "var(--text-primary)", textDecoration: "none", fontSize: "0.95rem" }}>
            DagrAI
          </Link>
          <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{title || "Shared Conversation"}</span>
        </div>
        <Link href="/signup" style={{ background: "var(--brand)", color: "#fff", borderRadius: "6px", padding: "6px 14px", fontWeight: 500, textDecoration: "none", fontSize: "0.85rem" }}>
          Try DagrAI Free
        </Link>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px" }}>
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: "var(--brand)" }} />
          </div>
        )}

        {error && (
          <div className="text-center py-5">
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{error}</p>
            <Link href="/" style={{ color: "var(--brand)" }}>Go to DagrAI</Link>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="mb-4">
            {msg.role === "user" ? (
              <div style={{
                background: "var(--brand-subtle)", border: "1px solid rgba(139,92,246,0.15)",
                borderRadius: "8px", padding: "10px 14px", fontSize: "0.95rem",
                marginLeft: "auto", maxWidth: "80%", color: "var(--text-primary)",
              }}>
                {msg.content}
              </div>
            ) : (
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                borderRadius: "8px", padding: "14px 16px", fontSize: "0.95rem",
                lineHeight: 1.7, color: "var(--text-primary)",
              }}>
                <MarkdownRenderer content={msg.content} />
                {msg.model && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid var(--border-subtle)" }}>
                    {msg.model}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
