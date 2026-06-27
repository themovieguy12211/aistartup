"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container, Form, Spinner } from "react-bootstrap";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The reset link includes a token in the URL hash.
    // The browser client exchanges it for a session automatically.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    }
  };

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ maxWidth: "440px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-semibold">Set new password</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            {done ? "Password updated." : "Enter a new password for your account."}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {!ready && !error ? (
          <div className="text-center py-4">
            <Spinner size="sm" style={{ color: "var(--brand)" }} />
          </div>
        ) : error && !done ? (
          <div className="text-center">
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
              {error}
            </p>
            <Link href="/forgot-password" style={{ color: "var(--brand)", fontSize: "0.9rem" }}>
              Request a new reset link
            </Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Password updated successfully. Redirecting to sign in...
            </p>
            <Link href="/login" style={{ color: "var(--brand)", fontSize: "0.9rem" }}>
              Sign in now
            </Link>
          </div>
        ) : (
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
