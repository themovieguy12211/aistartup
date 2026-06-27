"use client";

import { useSession } from "@/lib/use-session";
import { useState, useEffect } from "react";
import { Card, Spinner } from "react-bootstrap";

interface Memory {
  id: string;
  key: string;
  value: string;
  source: string;
  created_at: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/memories")
      .then((r) => r.json())
      .then((d) => setMemories(d.memories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await fetch("/api/memories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div>
      <h2 className="fw-bold mb-1">Settings</h2>
      <p style={{ color: "var(--text-secondary)" }} className="mb-4">
        Manage your account and preferences.
      </p>

      <Card className="mb-4">
        <Card.Header><span className="fw-semibold">Profile</span></Card.Header>
        <Card.Body>
          <div className="mb-3">
            <label className="form-label" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Email</label>
            <div className="fw-semibold">{session?.user?.email}</div>
          </div>
          <div>
            <label className="form-label" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Name</label>
            <div className="fw-semibold">{session?.user?.name || "Not set"}</div>
          </div>
        </Card.Body>
      </Card>

      {/* Memory Management */}
      <Card className="mb-4">
        <Card.Header>
          <span className="fw-semibold">🧠 Memory</span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: "8px" }}>
            Facts DagrAI remembers about you across conversations
          </span>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <Spinner size="sm" style={{ color: "var(--brand-purple)" }} />
          ) : memories.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No memories yet. They&apos;ll appear as you chat — things like your name, role, preferences, and projects.
            </p>
          ) : (
            memories.map((m) => (
              <div key={m.id} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>{m.key}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{m.value}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                    {m.source === "auto" ? "auto-detected" : "manual"} · {new Date(m.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => handleDelete(m.id)} style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer" }}>
                  Forget
                </button>
              </div>
            ))
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header><span className="fw-semibold">Danger Zone</span></Card.Header>
        <Card.Body>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Deleting your account is permanent and cannot be undone.
          </p>
          <button disabled style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 16px", fontSize: "0.85rem", cursor: "default" }}>Delete Account (Coming Soon)</button>
        </Card.Body>
      </Card>
    </div>
  );
}
