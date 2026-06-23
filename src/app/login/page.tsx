"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          <h2 className="fw-bold">Welcome Back</h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            Sign in to your SonixAI account
          </p>
        </div>

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
              className="bg-dark border-secondary text-light"
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
              className="bg-dark border-secondary text-light"
            />
          </Form.Group>

          <Button type="submit" className="btn-primary w-100 py-2" disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Signing in...</> : "Sign In"}
          </Button>

          <div className="text-center mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "var(--brand-purple)" }}>Sign up</Link>
          </div>
        </Form>
      </Container>
    </>
  );
}
