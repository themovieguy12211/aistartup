import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";

export default function CtaSection() {
  return (
    <section className="py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <Container>
        <div
          className="text-center p-5 rounded-4"
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.06))",
            border: "1px solid rgba(139, 92, 246, 0.15)",
          }}
        >
          <h2 className="display-6 fw-bold mb-3">Ready to Ship AI Faster?</h2>
          <p className="lead mb-4" style={{ color: "rgba(255,255,255,0.6)", maxWidth: "500px", margin: "0 auto 24px" }}>
            Sign up in 30 seconds. Get your API key. Start building with every model — at the lowest price.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link href="/signup" className="btn btn-primary btn-lg px-4 py-3">
              Create Free Account →
            </Link>
            <Link
              href="/docs"
              className="btn btn-outline-light btn-lg px-4 py-3"
            >
              Read the Docs
            </Link>
          </div>
          <div className="mt-3" style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
            Join 2,000+ developers already building with DagrAI
          </div>
        </div>
      </Container>
    </section>
  );
}
