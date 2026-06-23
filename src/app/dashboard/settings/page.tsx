"use client";

import { useSession } from "@/lib/use-session";
import { Card } from "react-bootstrap";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div>
      <h2 className="fw-bold mb-1">Settings</h2>
      <p style={{ color: "rgba(255,255,255,0.5)" }} className="mb-4">
        Manage your account settings.
      </p>

      <Card className="mb-4">
        <Card.Header>
          <span className="fw-semibold">Profile</span>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <label className="form-label" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
              Email
            </label>
            <div className="fw-semibold">{session?.user?.email}</div>
          </div>
          <div>
            <label className="form-label" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
              Name
            </label>
            <div className="fw-semibold">{session?.user?.name || "Not set"}</div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <span className="fw-semibold">Danger Zone</span>
        </Card.Header>
        <Card.Body>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
            Deleting your account is permanent and cannot be undone.
          </p>
          <button className="btn btn-outline-danger" disabled>
            Delete Account (Coming Soon)
          </button>
        </Card.Body>
      </Card>
    </div>
  );
}
