import { Container, Row, Col } from "react-bootstrap";

const features = [
  {
    title: "One API, All Models",
    description:
      "Forget managing five different API keys and SDKs. One endpoint talks to Claude, DeepSeek, Llama, Mistral, and more — same request format as OpenAI.",
  },
  {
    title: "Always the Lowest Price",
    description:
      "Provider cost + 15% flat markup. Claude Sonnet at $3.45/M input. DeepSeek Flash at $0.16/M for simple queries. Pay only for what you use.",
  },
  {
    title: "Smart Caching",
    description:
      "Identical or similar requests are served from cache — cutting costs by up to 50% without you thinking about it.",
  },
  {
    title: "Usage Dashboard",
    description:
      "See exactly how much each key is spending, which models are used most, and where you can optimize.",
  },
  {
    title: "Security",
    description:
      "API keys hashed with SHA-256. Data encrypted at rest and in transit. Your prompts are never stored or used for training.",
  },
  {
    title: "Streaming & Batch",
    description:
      "SSE streaming for real-time chat. Batch processing for non-urgent requests at lower prices. OpenAI-compatible format.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-5" style={{ borderTop: "1px solid var(--border)" }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-3" style={{ fontSize: "2rem" }}>
            Why Developers Choose DagrAI
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto" }}>
            Everything you need to ship AI features fast — without vendor lock-in or inflated bills.
          </p>
        </div>
        <Row>
          {features.map((f, i) => (
            <Col md={4} key={i} className="mb-4">
              <div className="feature-card p-4 h-100">
                <h5 className="fw-semibold mb-2" style={{ fontSize: "1rem" }}>{f.title}</h5>
                <p className="mb-0" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {f.description}
                </p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
