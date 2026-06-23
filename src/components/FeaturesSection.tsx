import { Container, Row, Col } from "react-bootstrap";

const features = [
  {
    icon: "🔌",
    title: "One API, All Models",
    description:
      "Forget managing five different API keys and SDKs. One endpoint talks to DeepSeek, Claude, Llama, Mistral, and more — same request format as OpenAI.",
  },
  {
    icon: "💰",
    title: "Always the Lowest Price",
    description:
      "We auto-route to the cheapest model that can handle your request. DeepSeek for simple queries at $0.14/M tokens. Claude only when you need it.",
  },
  {
    icon: "⚡",
    title: "Smart Caching",
    description:
      "Identical or similar requests are served from cache instead of hitting the model again — cutting costs by up to 50% without you thinking about it.",
  },
  {
    icon: "📊",
    title: "Real-Time Usage Dashboard",
    description:
      "See exactly how much each key is spending, which models are used most, and where you can optimize — all from a clean dashboard.",
  },
  {
    icon: "🔒",
    title: "Enterprise-Grade Security",
    description:
      "API keys hashed with SHA-256. Data encrypted at rest and in transit. Your prompts are never stored or used for training.",
  },
  {
    icon: "🎯",
    title: "Streaming & Batch Support",
    description:
      "SSE streaming for real-time chat. Batch processing for non-urgent requests at even lower prices. Standard OpenAI-compatible format.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold mb-3">
            Why Developers Choose{" "}
            <span
              style={{
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AragoniteAI
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: "600px", margin: "0 auto" }}>
            Everything you need to ship AI features fast — without the vendor lock-in or inflated bills.
          </p>
        </div>
        <Row>
          {features.map((f, i) => (
            <Col md={4} key={i} className="mb-4">
              <div className="feature-card p-4 h-100">
                <div className="fs-2 mb-3">{f.icon}</div>
                <h5 className="fw-semibold mb-2">{f.title}</h5>
                <p className="mb-0" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
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
