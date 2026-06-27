"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/use-session";
import { useState } from "react";
import { Container, Nav, Navbar as BsNavbar } from "react-bootstrap";

interface Props {
  credits: number | null;
  onCreditsChange: () => void;
}

export default function ChatNavbar({ credits }: Props) {
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const closeNav = () => setExpanded(false);
  const isLow = credits != null && credits <= 0;

  return (
    <BsNavbar
      expand="lg"
      expanded={expanded}
      onToggle={setExpanded}
      className="navbar-dark navbar-custom py-2 sticky-top"
    >
      <Container fluid>
        <BsNavbar.Brand as={Link} href="/" onClick={closeNav}>
          DagrAI
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="chat-nav" />
        <BsNavbar.Collapse id="chat-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} href="/docs" onClick={closeNav}>
              Docs
            </Nav.Link>
            <Nav.Link as={Link} href="/pricing" onClick={closeNav}>
              Pricing
            </Nav.Link>
            <Nav.Link as={Link} href="/dashboard" onClick={closeNav}>
              Dashboard
            </Nav.Link>
          </Nav>

          <Nav className="align-items-center gap-2">
            {session ? (
              <>
                {/* Credits (authenticated) */}
                <Link
                  href="/dashboard/billing"
                  className="text-decoration-none d-flex align-items-center gap-1"
                  onClick={closeNav}
                >
                  <span
                    className="d-inline-block rounded-circle"
                    style={{
                      width: "8px",
                      height: "8px",
                      background: isLow ? "#ef4444" : "#22c55e",
                    }}
                  />
                  <span style={{ color: isLow ? "#ef4444" : "#22c55e", fontSize: "0.85rem", fontWeight: 500 }}>
                    {credits != null ? `$${credits.toFixed(4)}` : "—"}
                  </span>
                </Link>

                {/* User menu */}
                <div className="dropdown">
                  <button
                    className="dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      borderRadius: "6px",
                      padding: "4px 12px",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    {session?.user?.name || session?.user?.email?.split("@")[0]}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <li><Link href="/dashboard" className="dropdown-item" style={{ color: "var(--text-primary)" }} onClick={closeNav}>Dashboard</Link></li>
                    <li><Link href="/dashboard/keys" className="dropdown-item" style={{ color: "var(--text-primary)" }} onClick={closeNav}>API Keys</Link></li>
                    <li><Link href="/dashboard/billing" className="dropdown-item" style={{ color: "var(--text-primary)" }} onClick={closeNav}>Billing</Link></li>
                    {(session?.user as { role?: string } | undefined)?.role === "admin" && (
                      <>
                        <li><hr className="dropdown-divider" style={{ borderColor: "var(--border)" }} /></li>
                        <li><Link href="/admin" className="dropdown-item" style={{ color: "var(--text-primary)" }} onClick={closeNav}>Admin</Link></li>
                      </>
                    )}
                    <li><hr className="dropdown-divider" style={{ borderColor: "var(--border)" }} /></li>
                    <li><button className="dropdown-item" style={{ color: "var(--text-muted)" }} onClick={async () => { closeNav(); await signOut(); window.location.href = "/"; }}>Sign Out</button></li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Nav.Link as={Link} href="/login" onClick={closeNav}>Sign In</Nav.Link>
                <Link href="/signup" onClick={closeNav} style={{ background: "var(--brand)", color: "#fff", borderRadius: "6px", padding: "5px 14px", fontSize: "0.85rem", fontWeight: 500, textDecoration: "none" }}>Sign Up</Link>
              </>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
