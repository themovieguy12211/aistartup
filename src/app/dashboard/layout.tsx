"use client";

import { useSession, signOut } from "@/lib/use-session";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container, Nav, Spinner } from "react-bootstrap";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/keys", label: "API Keys", icon: "🔑" },
  { href: "/", label: "Chat", icon: "💬" },
  { href: "/dashboard/billing", label: "Billing", icon: "💳" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" style={{ color: "var(--brand-purple)" }} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        className="sidebar d-flex flex-column flex-shrink-0 p-3"
        style={{ width: "240px" }}
      >
        <Link
          href="/"
          className="text-decoration-none mb-4 px-2"
          style={{
            fontWeight: 700,
            fontSize: "1.1rem",
            background: "var(--brand-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ◆ DagrAI
        </Link>

        <Nav className="flex-column">
          {navItems.map((item) => (
            <Nav.Link
              key={item.href}
              as={Link}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
            >
              <span className="me-2">{item.icon}</span>
              {item.label}
            </Nav.Link>
          ))}
        </Nav>

        <div className="mt-auto pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-2 mb-2" style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
            {session.user?.email}
          </div>
          <button
            onClick={() => signOut().then(() => { window.location.href = "/"; })}
            className="btn btn-sm btn-outline-danger w-100"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow-1 p-4" style={{ overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
