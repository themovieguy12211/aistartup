"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container, Form, Alert, Spinner } from "react-bootstrap";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const verified = searchParams.get("verified");
  const confirmError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ maxWidth: "440px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-semibold">Welcome back</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Sign in to your DagrAI account
          </p>
        </div>

        {verified && (
          <Alert variant="success" dismissible>
            Email verified! Sign in to continue.
          </Alert>
        )}
        {confirmError === "invalid_token" && (
          <Alert variant="danger" dismissible>
            Invalid or expired confirmation link. Please sign up again.
          </Alert>
        )}
        {confirmError === "expired_token" && (
          <Alert variant="danger" dismissible>
            Confirmation link expired. Please sign up again.
          </Alert>
        )}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

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

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="text-end mt-1">
              <Link href="/forgot-password" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Forgot password?
              </Link>
            </div>
          </Form.Group>

          <button type="submit" style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 0", fontWeight: 500, fontSize: "0.95rem", cursor: loading ? "default" : "pointer", width: "100%", opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Signing in...</> : "Sign In"}
          </button>

          <div className="text-center mt-3" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "var(--brand)" }}>Sign up</Link>
          </div>
        </Form>
      </Container>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
