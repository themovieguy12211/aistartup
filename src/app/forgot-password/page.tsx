"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Form, Spinner } from "react-bootstrap";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ maxWidth: "440px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-semibold">Reset your password</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            {sent
              ? "Check your email for a reset link."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {sent ? (
          <div className="text-center">
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
              If an account exists for {email}, you&apos;ll receive a password reset link shortly.
            </p>
            <Link href="/login" style={{ color: "var(--brand)", fontSize: "0.9rem" }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <button
              type="submit"
              style={{
                background: "var(--brand)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 0",
                fontWeight: 500,
                fontSize: "0.95rem",
                cursor: loading ? "default" : "pointer",
                width: "100%",
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? <><Spinner size="sm" className="me-2" />Sending...</> : "Send Reset Link"}
            </button>

            <div className="text-center mt-3" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              <Link href="/login" style={{ color: "var(--brand)" }}>Back to sign in</Link>
            </div>
          </Form>
        )}
      </Container>
    </>
  );
}
