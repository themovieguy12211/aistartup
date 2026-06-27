"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card, Table, Form, Modal, Spinner, Badge } from "react-bootstrap";

interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeyValue(data.key);
        setShowCreate(false);
        setNewKeyName("");
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to create key:", err);
    } finally {
      setCreating(false);
    }
  }

  const handleToggle = async (id: string, activate: boolean) => {
    try {
      await fetch(`/api/keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: activate }),
      });
      fetchKeys();
    } catch (err) {
      console.error("Failed to toggle key:", err);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Permanently delete this API key?")) return;
    fetch(`/api/keys/${id}`, { method: "DELETE" })
      .then(() => fetchKeys())
      .catch((err) => console.error("Failed to delete key:", err));
  };

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--brand-purple)" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">API Keys</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Manage your API keys. Keys are one-way hashed — they&apos;re only shown once at creation.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 16px", fontWeight: 500, fontSize: "0.85rem", cursor: "pointer" }}>
          + New API Key
        </button>
      </div>

      {/* New key display */}
      {newKeyValue && (
        <Card className="mb-4" style={{ borderColor: "#22c55e" }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-semibold mb-2" style={{ color: "#22c55e" }}>
                  Key Created Successfully
                </div>
                <p style={{ color: "#22c55e", fontSize: "0.9rem", margin: 0 }}>
                  Copy this key now — it will not be shown again.
                </p>
              </div>
              <button
                onClick={() => setNewKeyValue(null)}
                style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 10px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Dismiss
              </button>
            </div>
            <div
              className="api-key-value mt-3 position-relative d-inline-block"
              onClick={() => copyToClipboard(newKeyValue)}
            >
              {newKeyValue}
              {copied === newKeyValue && (
                <span className="copied-tooltip">Copied!</span>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      <Card>
        {keys.length === 0 ? (
          <Card.Body className="text-center py-5">
            <p style={{ color: "var(--text-muted)" }}>
              You don&apos;t have any API keys yet. Create one to get started.
            </p>
          </Card.Body>
        ) : (
          <Table className="mb-0" responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Used</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="fw-semibold">{k.name || "Unnamed"}</td>
                  <td>
                    <code style={{ color: "rgba(255,255,255,0.5)" }}>
                      {k.prefix}...
                    </code>
                  </td>
                  <td>
                    <Badge bg={k.isActive ? "success" : "secondary"}>
                      {k.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      {k.isActive ? (
                        <button onClick={() => handleToggle(k.id, false)} style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 10px", fontSize: "0.8rem", cursor: "pointer" }}>
                          Revoke
                        </button>
                      ) : (
                        <button onClick={() => handleToggle(k.id, true)} style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 10px", fontSize: "0.8rem", cursor: "pointer" }}>
                          Enable
                        </button>
                      )}
                      <button onClick={() => handleDelete(k.id)} style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 8px", fontSize: "0.8rem", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Create modal */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} contentClassName="bg-dark text-light">
        <Modal.Header closeButton style={{ borderBottomColor: "rgba(255,255,255,0.06)" }}>
          <Modal.Title>Create New API Key</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Key Name (optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Production, Development"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="bg-dark border-secondary text-light"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTopColor: "var(--border-subtle)" }}>
          <button onClick={() => setShowCreate(false)} style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 14px", fontSize: "0.85rem", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={creating} style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontWeight: 500, fontSize: "0.85rem", cursor: creating ? "default" : "pointer", opacity: creating ? 0.7 : 1 }}>
            {creating ? "Creating..." : "Create Key"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
