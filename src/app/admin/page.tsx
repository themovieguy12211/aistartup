"use client";

import { useEffect, useState } from "react";
import { Row, Col, Card, Spinner } from "react-bootstrap";

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  totalCost: number;
  totalCalls: number;
  activeKeys: number;
  adminCount: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--brand-purple)" }} />
      </div>
    );
  }

  const cards = [
    { title: "Total Users", value: stats?.totalUsers ?? "—", icon: "👥", sub: `${stats?.adminCount ?? 0} admins` },
    { title: "Total API Calls", value: stats?.totalCalls?.toLocaleString() ?? "—", icon: "📨", sub: "All time" },
    { title: "Platform Revenue", value: stats?.totalRevenue != null ? `$${stats.totalRevenue.toFixed(4)}` : "—", icon: "💰", sub: "User charges" },
    { title: "Platform Cost", value: stats?.totalCost != null ? `$${stats.totalCost.toFixed(4)}` : "—", icon: "📉", sub: "What we pay providers" },
    { title: "Gross Profit", value: stats?.totalRevenue != null && stats?.totalCost != null ? `$${(stats.totalRevenue - stats.totalCost).toFixed(4)}` : "—", icon: "📈", sub: "Revenue − Cost" },
    { title: "Active API Keys", value: stats?.activeKeys ?? "—", icon: "🔑", sub: "Currently active" },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Admin Overview</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Platform-wide metrics and health.
          </p>
        </div>
      </div>

      <Row>
        {cards.map((c, i) => (
          <Col md={4} key={i} className="mb-3">
            <Card className="h-100">
              <Card.Body>
                <div className="fs-3 mb-2">{c.icon}</div>
                <div className="fs-4 fw-bold">{c.value}</div>
                <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>{c.title}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>{c.sub}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
