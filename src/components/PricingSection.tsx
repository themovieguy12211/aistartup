"use client";

import Link from "next/link";
import { Container, Row, Col, Table } from "react-bootstrap";
import { MODELS } from "@/lib/pricing";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "$1.00 free credits on signup. No credit card required.",
    features: [
      "$1.00 free credits (500-1000 messages)",
      "Access to all 6 models",
      "API key management",
      "Usage dashboard",
      "Hard cutoff when credits hit $0 — never overcharged",
    ],
    cta: "Get Free Credits",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pay-As-You-Go",
    price: "Top Up",
    period: "",
    desc: "Add credits as needed. Only pay for what you use.",
    features: [
      "Provider price + 15% flat markup",
      "No monthly minimum",
      "Credits never expire",
      "Email support",
      "Smart caching (coming soon)",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Volume",
    period: "",
    desc: "High volume? Self-hosted option available for AWS credit customers.",
    features: [
      "Dedicated infrastructure on your AWS account",
      "Self-hosted inference via vLLM on EC2",
      "Use your AWS credits for all inference",
      "Custom model fine-tuning",
      "SLA with 99.9% uptime",
      "Slack support",
    ],
    cta: "Contact Us",
    href: "mailto:enterprise@sonixai.dev",
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold mb-3">
            <span
              style={{
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Transparent
            </span>{" "}
            Pricing — Always Cheapest
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: "600px", margin: "0 auto" }}>
            We charge exactly <strong>provider price + 15%</strong> across every model.
            If you find a cheaper aggregator, we&apos;ll match it.
          </p>
        </div>

        <Row className="justify-content-center mb-5">
          {tiers.map((tier, i) => (
            <Col md={4} key={i} className="mb-4">
              <div className={`pricing-card p-4 h-100 d-flex flex-column ${tier.popular ? "popular" : ""}`}>
                {tier.popular && (
                  <div className="text-center mb-2">
                    <span
                      className="badge rounded-pill px-3 py-1"
                      style={{
                        background: "var(--brand-gradient)",
                        color: "#fff",
                        fontSize: "0.75rem",
                      }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="fw-bold mb-1">{tier.name}</h3>
                <div className="mb-2">
                  <span className="display-5 fw-bold">{tier.price}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                    {tier.period}
                  </span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>{tier.desc}</p>
                <ul className="list-unstyled mb-4 flex-grow-1">
                  {tier.features.map((f, j) => (
                    <li key={j} className="mb-2" style={{ fontSize: "0.95rem" }}>
                      <span style={{ color: "#22c55e", marginRight: "8px" }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`btn w-100 py-2 ${tier.popular ? "btn-primary" : "btn-outline-light"}`}
                >
                  {tier.cta}
                </Link>
              </div>
            </Col>
          ))}
        </Row>

        {/* Model pricing table */}
        <div className="text-center mb-4">
          <h3 className="fw-bold">Per-Model Rates</h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
            All prices per 1 million tokens. Provider cost + 15%.
          </p>
        </div>
        <Table className="mb-0" responsive>
          <thead>
            <tr>
              <th>Model</th>
              <th>Input ($/M tok)</th>
              <th>Output ($/M tok)</th>
              <th>Context</th>
              <th>Features</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.id}>
                <td className="fw-semibold">
                  {m.name}
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                    {m.id}
                  </div>
                </td>
                <td>
                  <span style={{ color: "#22c55e" }}>${m.pricePerMIn.toFixed(2)}</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginLeft: "6px" }}>
                    (cost ${m.costPerMIn.toFixed(2)})
                  </span>
                </td>
                <td>
                  <span style={{ color: "#22c55e" }}>${m.pricePerMOut.toFixed(2)}</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginLeft: "6px" }}>
                    (cost ${m.costPerMOut.toFixed(2)})
                  </span>
                </td>
                <td>{(m.contextWindow / 1000).toFixed(0)}k</td>
                <td>
                  {m.features.map((f) => (
                    <span
                      key={f}
                      className="badge rounded-pill me-1"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.7rem",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="text-center mt-3" style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
          Prices may fluctuate with provider changes. We always pass savings on to you.
        </div>
      </Container>
    </section>
  );
}
