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
        <Spinner animation="border" style={{ color: "var(--brand-purple)" }} />
      </div>
    );
  }

  const cards = [
    {
      title: "Total Requests",
      value: stats?.totalRequests?.toLocaleString() ?? "—",
      subtitle: "All time",
      icon: "📨",
    },
    {
      title: "Total Tokens",
      value: stats?.totalTokens?.toLocaleString() ?? "—",
      subtitle: "Input + Output",
      icon: "🧮",
    },
    {
      title: "Total Spend",
      value: stats?.totalCost != null ? `$${stats.totalCost.toFixed(4)}` : "—",
      subtitle: "Across all models",
      icon: "💵",
    },
    {
      title: "Active Keys",
      value: stats?.activeKeys?.toString() ?? "—",
      subtitle: "API keys",
      icon: "🔑",
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Welcome back{ session?.user?.name ? `, ${session.user.name}` : ""} 👋
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Here&apos;s what&apos;s happening with your account.
          </p>
        </div>
        <Link href="/dashboard/playground" className="btn btn-primary">
          Open Playground →
        </Link>
      </div>

      {/* Credit Balance Alert */}
      <div
        className={`p-3 rounded-3 mb-3 d-flex align-items-center justify-content-between ${
          (stats?.credits ?? 0) <= 0 ? "bg-danger bg-opacity-10" : ""
        }`}
        style={{
          background:
            (stats?.credits ?? 0) > 0
              ? "rgba(34, 197, 94, 0.08)"
              : undefined,
          border: `1px solid ${
            (stats?.credits ?? 0) > 0
              ? "rgba(34, 197, 94, 0.25)"
              : "rgba(239, 68, 68, 0.3)"
          }`,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <span className="fs-4">{ (stats?.credits ?? 0) > 0 ? "💰" : "⚠️" }</span>
          <div>
            <div className="fw-bold fs-5">
              {stats?.credits != null
                ? `$${stats.credits.toFixed(4)}`
                : "—"}
            </div>
            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
              {(stats?.credits ?? 0) > 0
                ? "Available credits — API calls stop when this hits $0.00"
                : "Out of credits! Add more to resume API access."}
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className={`btn btn-sm ${(stats?.credits ?? 0) <= 0 ? "btn-danger" : "btn-outline-light"}`}
        >
          {(stats?.credits ?? 0) <= 0 ? "Add Credits →" : "Top Up →"}
        </Link>
      </div>

      <Row className="mb-4">
        {cards.map((card, i) => (
          <Col md={3} key={i} className="mb-3">
            <Card className="h-100">
              <Card.Body>
                <div className="fs-4 mb-2">{card.icon}</div>
                <div className="fs-4 fw-bold">{card.value}</div>
                <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                  {card.title}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
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
              <Link href="/dashboard/keys" style={{ color: "var(--brand-purple)" }}>
                Create an API key
              </Link>{" "}
              from the API Keys page.
            </li>
            <li>
              Copy your key and use it in your app:
              <div
                className="mt-2 p-3 rounded"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.85rem",
                }}
              >
                curl https://api.sonixai.dev/v1/chat/completions \<br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_API_KEY&quot; \<br />
                &nbsp;&nbsp;-d &apos;{`{"model": "deepseek-chat", "messages": [{"role": "user", "content": "Hello!"}]}`}&apos;
              </div>
            </li>
            <li>
              Or try it right now in the{" "}
              <Link href="/dashboard/playground" style={{ color: "var(--brand-purple)" }}>
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
