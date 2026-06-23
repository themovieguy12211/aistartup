"use client";

import Navbar from "@/components/Navbar";
import { Container, Card, Row, Col } from "react-bootstrap";
import { MODELS } from "@/lib/pricing";

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="py-5">
        <Container style={{ maxWidth: "800px" }}>
          <h1 className="display-5 fw-bold mb-2">API Documentation</h1>
          <p style={{ color: "rgba(255,255,255,0.5)" }} className="mb-5">
            One endpoint, every model. OpenAI-compatible format.
          </p>

          {/* Quick Start */}
          <Card className="mb-4">
            <Card.Header>
              <span className="fw-bold">Quick Start</span>
            </Card.Header>
            <Card.Body>
              <h6 className="fw-semibold mb-2">1. Get an API Key</h6>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
                Sign up and create an API key from your dashboard.
              </p>

              <h6 className="fw-semibold mb-2">2. Make a Request</h6>
              <div
                className="p-3 rounded mb-3"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.85rem",
                }}
              >
                curl https://api.sonixai.dev/v1/chat/completions \<br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer sk-your-api-key&quot; \<br />
                &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />
                &nbsp;&nbsp;-d &apos;{`{
  "model": "deepseek-chat",
  "messages": [{"role": "user", "content": "Hello!"}]
}`}&apos;
              </div>

              <h6 className="fw-semibold mb-2">3. Response</h6>
              <div
                className="p-3 rounded"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.85rem",
                }}
              >
                {`{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    }
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  },
  "sonixai": {
    "model": "deepseek-chat",
    "provider": "deepseek",
    "cost": "$0.000003",
    "latency_ms": 245
  }
}`}
              </div>
            </Card.Body>
          </Card>

          {/* Endpoints */}
          <Card className="mb-4">
            <Card.Header>
              <span className="fw-bold">Endpoints</span>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <h6 className="fw-semibold">
                    <span className="badge bg-success me-2">POST</span>
                    /v1/chat/completions
                  </h6>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
                    Chat completion endpoint. OpenAI-compatible. Supports streaming (SSE).
                  </p>
                </Col>
                <Col md={6} className="mb-3">
                  <h6 className="fw-semibold">
                    <span className="badge bg-primary me-2">GET</span>
                    /v1/models
                  </h6>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
                    List all available models and their pricing.
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Available Models */}
          <Card className="mb-4">
            <Card.Header>
              <span className="fw-bold">Available Models</span>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Model ID</th>
                      <th>Context</th>
                      <th>Input ($/M tok)</th>
                      <th>Output ($/M tok)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODELS.map((m) => (
                      <tr key={m.id}>
                        <td><code>{m.id}</code></td>
                        <td>{(m.contextWindow / 1000).toFixed(0)}k</td>
                        <td style={{ color: "#22c55e" }}>${m.pricePerMIn.toFixed(2)}</td>
                        <td style={{ color: "#22c55e" }}>${m.pricePerMOut.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-0" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
                All prices = provider cost + 15%. Never overpay.
              </p>
            </Card.Body>
          </Card>

          {/* Streaming */}
          <Card>
            <Card.Header>
              <span className="fw-bold">Streaming</span>
            </Card.Header>
            <Card.Body>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
                Set <code>stream: true</code> in your request body. Responses are sent as Server-Sent Events (SSE).
              </p>
              <div
                className="p-3 rounded"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.85rem",
                }}
              >
                {`{"model": "deepseek-chat", "messages": [...], "stream": true}`}
              </div>
            </Card.Body>
          </Card>
        </Container>
      </main>
    </>
  );
}
