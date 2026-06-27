"use client";

import Link from "next/link";
import { Container, Row, Col, Table } from "react-bootstrap";
import { MODELS } from "@/lib/pricing";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "50,000 free tokens per day. No credit card required.",
    features: [
      "50,000 tokens/day — try every model, including Claude",
      "Claude Opus, Sonnet, Haiku + DeepSeek, Llama, Mistral",
      "API access included",
      "Usage dashboard",
      "Never charged — hard cutoff when daily limit hit",
    ],
    cta: "Start Free",
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
    price: "Custom",
    period: "",
    desc: "For teams and platforms that need scale, security, and dedicated support.",
    features: [
      "Unlimited API requests",
      "Volume discounts — the more you use, the less you pay",
      "99.9% SLA with uptime guarantee",
      "SSO / SAML / OIDC",
      "Audit logs & compliance reporting",
      "Dedicated Slack channel + priority support",
      "Invoice billing (NET 30)",
    ],
    cta: "Contact Sales",
    href: "mailto:enterprise@dagrai.xyz",
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-5" style={{ borderTop: "1px solid var(--border)" }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-3" style={{ fontSize: "2rem" }}>
            Transparent Pricing
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
            Provider price + 15% across every model.
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
                      className="px-2 py-1"
                      style={{
                        background: "var(--brand-subtle)",
                        color: "var(--brand)",
                        fontSize: "0.75rem",
                        borderRadius: "4px",
                        fontWeight: 500,
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
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{tier.desc}</p>
                <ul className="list-unstyled mb-4 flex-grow-1">
                  {tier.features.map((f, j) => (
                    <li key={j} className="mb-2" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--brand)", marginRight: "8px" }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  style={{
                    background: tier.popular ? "var(--brand)" : "var(--bg-elevated)",
                    color: tier.popular ? "#fff" : "var(--text-primary)",
                    border: tier.popular ? "none" : "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "8px 0",
                    fontWeight: 500,
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            </Col>
          ))}
        </Row>

        <div className="text-center mb-4">
          <h3 className="fw-bold" style={{ fontSize: "1.5rem" }}>Per-Model Rates</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
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
                <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  {m.features.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="text-center mt-3" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Prices may fluctuate with provider changes. We always pass savings on to you.
        </div>
      </Container>
    </section>
  );
}
