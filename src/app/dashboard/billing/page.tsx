"use client";
export const dynamic = "force-dynamic";

import { Card } from "react-bootstrap";

export default function BillingPage() {
  return (
    <div>
      <h2 className="fw-bold mb-1">Billing</h2>
      <p style={{ color: "var(--text-secondary)" }} className="mb-4">
        Usage breakdown and plan management.
      </p>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Current Plan
              </span>
              <h4 className="fw-semibold mb-1">Free</h4>
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                50,000 tokens/day · All models
              </p>
            </div>
            <button disabled style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 16px", fontSize: "0.85rem", cursor: "default" }}>
              Upgrade Coming Soon
            </button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <span className="fw-semibold">Usage</span>
        </Card.Header>
        <Card.Body>
          <div className="row text-center">
            <div className="col-md-4 mb-3">
              <div className="fs-3 fw-semibold">0</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Requests</div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="fs-3 fw-semibold">0</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Tokens</div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="fs-3 fw-semibold">$0.00</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Cost</div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
