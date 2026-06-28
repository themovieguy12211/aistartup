"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container, Form, Spinner } from "react-bootstrap";
import Navbar from "@/components/Navbar";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing reset token. Please request a new reset link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ maxWidth: "440px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-semibold">Set new password</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            {done ? "Password updated." : error && !done ? "" : "Enter a new password for your account."}
          </p>
        </div>

        {error && !done && (
          <div className="text-center">
            <div className="alert alert-danger" style={{ fontSize: "0.9rem" }}>
              {error}
            </div>
            <Link href="/forgot-password" style={{ color: "var(--brand)", fontSize: "0.9rem" }}>
              Request a new reset link
            </Link>
          </div>
        )}

        {done && (
          <div className="text-center">
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Password updated successfully. Redirecting to sign in...
            </p>
            <Link href="/login" style={{ color: "var(--brand)", fontSize: "0.9rem" }}>
              Sign in now
            </Link>
          </div>
        )}

        {!error && !done && (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
              {loading ? <><Spinner size="sm" className="me-2" />Updating...</> : "Update Password"}
            </button>
          </Form>
        )}
      </Container>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="d-flex justify-content-center min-vh-100"><Spinner style={{ color: "var(--brand)", marginTop: "100px" }} /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
