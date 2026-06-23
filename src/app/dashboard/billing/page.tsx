"use client";
export const dynamic = "force-dynamic";

import { Card } from "react-bootstrap";

export default function BillingPage() {
  return (
    <div>
      <h2 className="fw-bold mb-1">Billing</h2>
      <p style={{ color: "rgba(255,255,255,0.5)" }} className="mb-4">
        Usage breakdown and plan management.
      </p>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="badge rounded-pill mb-2" style={{ background: "var(--brand-gradient)", color: "#fff" }}>
                Current Plan
              </span>
              <h4 className="fw-bold mb-1">Free</h4>
              <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>
                1,000 requests / month · All models
              </p>
            </div>
            <button className="btn btn-outline-light" disabled>
              Upgrade Coming Soon
            </button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <span className="fw-semibold">Usage This Month</span>
        </Card.Header>
        <Card.Body>
          <div className="row text-center">
            <div className="col-md-4 mb-3">
              <div className="fs-3 fw-bold">0</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Requests</div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="fs-3 fw-bold">0</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Tokens</div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="fs-3 fw-bold">$0.00</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Estimated Cost</div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
