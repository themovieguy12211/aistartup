"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card, Table, Form, Modal, Badge, Spinner } from "react-bootstrap";

interface User {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  role: string;
  createdAt: string;
  _count: { apiKeys: number; usageRecords: number };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjustCredits(userId: string, amount: number) {
    setSaving(true);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount }),
      });
      setEditUser(null);
      setCreditAmount("");
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Make this user ${newRole}?`)) return;
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

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
          <h2 className="fw-semibold mb-1">Users</h2>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            {users.length} registered users
          </p>
        </div>
        <Form.Control
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-dark text-light border-secondary"
          style={{ maxWidth: "300px" }}
        />
      </div>

      <Card>
        <Table className="mb-0" responsive>
          <thead>
            <tr>
              <th>User</th>
              <th>Credits</th>
              <th>Role</th>
              <th>Keys</th>
              <th>Calls</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="fw-semibold">{user.email}</div>
                  {user.name && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {user.name}
                    </div>
                  )}
                </td>
                <td>
                  <span
                    className="fw-bold"
                    style={{
                      color: user.credits <= 0 ? "#ef4444" : "#22c55e",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    ${user.credits.toFixed(4)}
                  </span>
                </td>
                <td>
                  <Badge
                    bg={user.role === "admin" ? "danger" : "secondary"}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleToggleRole(user.id, user.role)}
                    title="Click to toggle"
                  >
                    {user.role}
                  </Badge>
                </td>
                <td>{user._count.apiKeys}</td>
                <td>{user._count.usageRecords}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <button
                    onClick={() => {
                      setEditUser(user);
                      setCreditAmount("");
                    }}
                    style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 10px", fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    Adjust Credits
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Credit adjustment modal */}
      <Modal show={!!editUser} onHide={() => setEditUser(null)} contentClassName="bg-dark text-light">
        <Modal.Header closeButton style={{ borderBottomColor: "var(--border-subtle)" }}>
          <Modal.Title>Adjust Credits — {editUser?.email}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <span style={{ color: "var(--text-secondary)" }}>Current balance: </span>
            <span style={{ color: "#22c55e", fontWeight: 600 }}>
              ${editUser?.credits?.toFixed(4)}
            </span>
          </div>
          <Form.Group>
            <Form.Label>Amount to add (can be negative)</Form.Label>
            <Form.Control
              type="number"
              step="0.001"
              placeholder="e.g. 10.00 or -5.00"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTopColor: "var(--border-subtle)" }}>
          <button onClick={() => setEditUser(null)} style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 14px", fontSize: "0.85rem", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            disabled={saving || !creditAmount}
            onClick={() => handleAdjustCredits(editUser!.id, parseFloat(creditAmount))}
            style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontWeight: 500, fontSize: "0.85rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving..." : "Apply"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
