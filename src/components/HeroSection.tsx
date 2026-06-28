import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";

export default function HeroSection() {
  return (
    <section className="py-5" style={{ minHeight: "85vh", display: "flex", alignItems: "center" }}>
      <Container>
        <Row className="align-items-center">
          <Col lg={7} className="animate-fade-in">
            <h1
              className="fw-bold mb-4"
              style={{ fontSize: "3rem", lineHeight: 1.2 }}
            >
              Claude & Every Model, One API
            </h1>
            <p className="mb-4" style={{ color: "var(--text-secondary)", maxWidth: "520px", fontSize: "1.1rem", lineHeight: 1.6 }}>
              Claude Opus, Sonnet, and Haiku — plus DeepSeek, Llama, Mistral — through a single unified API.
              Pay only for what you use at the lowest prices anywhere.
            </p>
            <div className="d-flex gap-3 flex-wrap mb-4">
              <Link href="/signup" style={{ background: "var(--brand)", color: "#fff", borderRadius: "6px", padding: "8px 20px", fontWeight: 500, textDecoration: "none", display: "inline-block" }}>
                Get Started Free
              </Link>
              <Link href="/docs" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 20px", fontWeight: 500, textDecoration: "none", display: "inline-block" }}>
                Documentation
              </Link>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No credit card required. 50,000 free tokens every day.
            </div>
          </Col>
          <Col lg={5} className="mt-5 mt-lg-0 d-none d-lg-block">
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "20px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.82rem",
                textAlign: "left",
              }}
            >
              <div style={{ color: "var(--text-muted)" }} className="mb-2">
                $ curl https://dagrai.xyz/v1/chat/completions \
              </div>
              <div style={{ color: "var(--text-muted)" }}>
                &nbsp;&nbsp;-H &quot;Authorization: Bearer sk-...&quot; \
              </div>
              <div style={{ color: "var(--text-muted)" }}>
                &nbsp;&nbsp;-d &apos;{`{"model": "deepseek-chat", "messages": [...]}`}&apos;
              </div>
              <div style={{ color: "#22c55e", marginTop: "12px" }}>
                {`{ "choices": [{ "message": { "content": "Hello!" } }] }`}
              </div>
            </div>
            <div className="mt-3 d-flex gap-3" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {["DeepSeek", "Claude", "Llama", "Mistral"].map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
