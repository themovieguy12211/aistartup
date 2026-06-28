"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container, Form, Alert, Spinner } from "react-bootstrap";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email.split("@")[0] },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.session) {
      // Auto-confirmed — user is logged in immediately
      fetch("/api/auth/send-welcome", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      router.push("/");
      router.refresh();
    } else {
      // Needs email confirmation — send verification email
      setCheckEmail(true);
      fetch("/api/auth/send-welcome", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    }
  };

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ maxWidth: "440px" }}>
        {checkEmail ? (
          <div className="text-center">
            <h2 className="fw-semibold mb-3">Check your email</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>
              We sent a confirmation link to <strong>{email}</strong>.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Click the link to verify your account. Check spam if you don't see it.
            </p>
          </div>
        ) : (
          <>
          <div className="text-center mb-4">
          <h2 className="fw-semibold">Create your account</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            50,000 free tokens every day — no card required.
          </p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name (optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Form.Group>

          <button type="submit" style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 0", fontWeight: 500, fontSize: "0.95rem", cursor: loading ? "default" : "pointer", width: "100%", opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Creating account...</> : "Create Free Account"}
          </button>

          <div className="text-center mt-3" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--brand)" }}>Sign in</Link>
          </div>
        </Form>
          </>
        )}
      </Container>
    </>
  );
}
