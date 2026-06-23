import Link from "next/link";
import { Container, Row, Col, Button } from "react-bootstrap";

export default function HeroSection() {
  return (
    <section className="hero-gradient py-5" style={{ minHeight: "90vh", display: "flex", alignItems: "center" }}>
      <Container>
        <Row className="align-items-center">
          <Col lg={7} className="animate-fade-in">
            <div className="mb-3">
              <span
                className="badge rounded-pill px-3 py-2"
                style={{
                  background: "rgba(139, 92, 246, 0.15)",
                  color: "var(--brand-purple)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                }}
              >
                🚀 Now serving 50+ models
              </span>
            </div>
            <h1
              className="display-3 fw-bold mb-4"
              style={{ lineHeight: 1.15, letterSpacing: "-0.02em" }}
            >
              One API for{" "}
              <span
                style={{
                  background: "var(--brand-gradient)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Every Model
              </span>
            </h1>
            <p className="lead mb-4" style={{ color: "rgba(255,255,255,0.6)", maxWidth: "540px" }}>
              Access DeepSeek, Claude, Llama, Mistral, and more through a single unified API.
              Pay only for what you use — at the lowest prices anywhere.
            </p>
            <div className="d-flex gap-3 flex-wrap mb-4">
              <Link href="/signup" className="btn btn-primary btn-lg px-4 py-3">
                Get Started Free →
              </Link>
              <Link
                href="/docs"
                className="btn btn-outline-light btn-lg px-4 py-3"
              >
                View Docs
              </Link>
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>
              No credit card required · 1000 free requests · Cancel anytime
            </div>
          </Col>
          <Col lg={5} className="text-center mt-5 mt-lg-0 d-none d-lg-block">
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "20px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.85rem",
                textAlign: "left",
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.4)" }} className="mb-2">
                $ curl https://api.sonixai.dev/v1/chat/completions \
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)" }}>
                &nbsp;&nbsp;-H &quot;Authorization: Bearer sk-...&quot; \
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)" }}>
                &nbsp;&nbsp;-d &apos;{`{"model": "deepseek-chat", "messages": [...]}`}&apos;
              </div>
              <div style={{ color: "#22c55e", marginTop: "12px" }}>
                {`{ "choices": [{ "message": { "content": "Hello! How can I help?" } }] }`}
              </div>
            </div>
            <div className="mt-4 d-flex justify-content-center gap-4">
              {["DeepSeek", "Claude", "Llama", "Mistral"].map((name) => (
                <span
                  key={name}
                  className="badge rounded-pill px-3 py-2"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
