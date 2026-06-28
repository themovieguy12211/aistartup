"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Spinner } from "react-bootstrap";

const TOPUP_AMOUNTS = [5, 10, 25, 50, 100];

function BillingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const successAmount = searchParams.get("amount");
  const canceled = searchParams.get("canceled");

  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // On successful Stripe return, verify and credit
    if (success === "true" && !verified) {
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.success) setCredits(d.newCredits);
          })
          .catch(() => {})
          .finally(() => setVerified(true));
        return;
      }
    }
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [success, verified, searchParams]);

  async function handleTopUp(amount: number) {
    setError("");
    setCheckingOut(amount);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error. Try again.");
    }
    setCheckingOut(null);
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="fw-semibold mb-1">Billing</h2>
      <p style={{ color: "var(--text-secondary)" }} className="mb-4">
        Top up your credits to keep using all models.
      </p>

      {/* Success banner */}
      {success && (
        <div
          className="p-3 rounded-3 mb-4"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            color: "#22c55e",
            fontSize: "0.95rem",
          }}
        >
          Payment successful{successAmount ? ` — $${successAmount} added to your balance.` : "."} Your credits have been updated.
        </div>
      )}

      {/* Canceled */}
      {canceled && (
        <div
          className="p-3 rounded-3 mb-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
          }}
        >
          Payment canceled. Your credits were not charged.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-danger" style={{ fontSize: "0.9rem" }}>
          {error}
        </div>
      )}

      {/* Current balance */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Current Balance
              </span>
              <div className="fw-semibold mt-1" style={{ fontSize: "1.5rem", color: credits !== null && credits > 0 ? "#22c55e" : "var(--text-primary)" }}>
                {credits !== null ? `$${credits.toFixed(4)}` : "—"}
              </div>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>
                {credits !== null && credits > 0
                  ? `~${Math.round(credits / 0.005)} messages with cheapest models`
                  : "Add credits to start using the API"}
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Top up */}
      <Card>
        <Card.Header>
          <span className="fw-semibold">Add Credits</span>
        </Card.Header>
        <Card.Body>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
            Select an amount. You&apos;ll be redirected to Stripe for secure payment.
          </p>
          <div className="d-flex gap-2 flex-wrap">
            {TOPUP_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleTopUp(amount)}
                disabled={checkingOut !== null}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: "6px",
                  padding: "10px 24px",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  cursor: checkingOut !== null ? "default" : "pointer",
                  opacity: checkingOut !== null ? 0.6 : 1,
                }}
              >
                {checkingOut === amount ? (
                  <><Spinner size="sm" style={{ marginRight: "6px" }} /> Redirecting...</>
                ) : (
                  `$${amount}`
                )}
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--brand)" }} />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
