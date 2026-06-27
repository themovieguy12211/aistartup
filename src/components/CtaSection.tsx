import Link from "next/link";
import { Container } from "react-bootstrap";

export default function CtaSection() {
  return (
    <section className="py-5" style={{ borderTop: "1px solid var(--border)" }}>
      <Container>
        <div
          className="text-center p-5 rounded"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="fw-bold mb-3" style={{ fontSize: "1.75rem" }}>Ready to Ship AI Faster?</h2>
          <p className="mb-4" style={{ color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 24px" }}>
            Sign up in 30 seconds. Get your API key. Start building with every model — at the lowest price.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link href="/signup" style={{ background: "var(--brand)", color: "#fff", borderRadius: "6px", padding: "8px 20px", fontWeight: 500, textDecoration: "none", display: "inline-block" }}>
              Create Free Account
            </Link>
            <Link href="/docs" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", fontWeight: 500, textDecoration: "none", display: "inline-block" }}>
              Read the Docs
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
