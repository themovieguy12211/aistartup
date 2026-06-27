"use client";
export const dynamic = "force-dynamic";

import { useSession } from "@/lib/use-session";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Row, Col, Card, Spinner } from "react-bootstrap";

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  activeKeys: number;
  credits: number;
  dailyFreeTokens: number;
}

export default function DashboardOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch usage stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  const hasCredits = (stats?.credits ?? 0) > 0;
  const hasFreeTokens = (stats?.dailyFreeTokens ?? 0) > 0;
  const isActive = hasCredits || hasFreeTokens;

  const cards = [
    {
      title: "Total Requests",
      value: stats?.totalRequests?.toLocaleString() ?? "—",
      subtitle: "All time",
    },
    {
      title: "Total Tokens",
      value: stats?.totalTokens?.toLocaleString() ?? "—",
      subtitle: "Input + Output",
    },
    {
      title: "Total Spend",
      value: stats?.totalCost != null ? `$${stats.totalCost.toFixed(4)}` : "—",
      subtitle: "Across all models",
    },
    {
      title: "Active Keys",
      value: stats?.activeKeys?.toString() ?? "—",
      subtitle: "API keys",
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-semibold mb-1">
            Welcome back{ session?.user?.name ? `, ${session.user.name}` : ""}
          </h2>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Here&apos;s what&apos;s happening with your account.
          </p>
        </div>
        <Link href="/dashboard/playground" style={{ background: "var(--brand)", color: "#fff", borderRadius: "6px", padding: "6px 16px", fontSize: "0.85rem", fontWeight: 500, textDecoration: "none" }}>
          Open Playground
        </Link>
      </div>

      {/* Balance Alert */}
      <div
        className="p-3 rounded-3 mb-3 d-flex align-items-center justify-content-between"
        style={{
          background: isActive ? "var(--bg-card)" : "var(--bg-card)",
          border: `1px solid var(--border)`,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div>
            {hasCredits ? (
              <div className="fw-semibold mb-1" style={{ color: "#22c55e" }}>
                ${stats!.credits.toFixed(4)} in credits
              </div>
            ) : (
              <div className="fw-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                $0.00 in credits
              </div>
            )}
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {hasFreeTokens
                ? `${(stats!.dailyFreeTokens / 1000).toFixed(0)}k free tokens remaining today`
                : "No free tokens remaining today"}
              {isActive
                ? " — API calls are active"
                : " — Add credits to resume"}
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          style={{
            background: !hasCredits ? "var(--brand)" : "var(--bg-elevated)",
            color: !hasCredits ? "#fff" : "var(--text-primary)",
            border: !hasCredits ? "none" : "1px solid var(--border)",
            borderRadius: "6px",
            padding: "5px 14px",
            fontSize: "0.82rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {!hasCredits ? "Add Credits" : "Top Up"}
        </Link>
      </div>

      <Row className="mb-4">
        {cards.map((card, i) => (
          <Col md={3} key={i} className="mb-3">
            <Card className="h-100">
              <Card.Body>
                <div className="fs-4 fw-bold">{card.value}</div>
                <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                  {card.title}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  {card.subtitle}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Card.Header>
          <span className="fw-semibold">Quick Start</span>
        </Card.Header>
        <Card.Body>
          <ol className="mb-0" style={{ lineHeight: 2 }}>
            <li>
              <Link href="/dashboard/keys" style={{ color: "var(--brand)" }}>
                Create an API key
              </Link>{" "}
              from the API Keys page.
            </li>
            <li>
              Copy your key and use it in your app:
              <div
                className="mt-2 p-3 rounded"
                style={{
                  background: "var(--bg-primary)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.85rem",
                }}
              >
                curl https://api.dagrai.xyz/v1/chat/completions \<br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_API_KEY&quot; \<br />
                &nbsp;&nbsp;-d &apos;{`{"model": "deepseek-chat", "messages": [{"role": "user", "content": "Hello!"}]}`}&apos;
              </div>
            </li>
            <li>
              Or try it right now in the{" "}
              <Link href="/dashboard/playground" style={{ color: "var(--brand)" }}>
                Playground
              </Link>
              .
            </li>
          </ol>
        </Card.Body>
      </Card>
    </div>
  );
}
