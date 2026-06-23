"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email.split("@")[0] },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      // The trigger in Supabase auto-creates the profile with $1.00 credits
      router.push("/");
      router.refresh();
    }
  };

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ maxWidth: "440px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold">Create Your Account</h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            $1.00 free credits — no card required.
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
              className="bg-dark border-secondary text-light"
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
              className="bg-dark border-secondary text-light"
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
              className="bg-dark border-secondary text-light"
            />
          </Form.Group>

          <Button type="submit" className="btn-primary w-100 py-2" disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Creating account...</> : "Create Free Account →"}
          </Button>

          <div className="text-center mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--brand-purple)" }}>Sign in</Link>
          </div>
        </Form>
      </Container>
    </>
  );
}
