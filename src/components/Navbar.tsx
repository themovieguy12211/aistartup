"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Container, Nav, Navbar as BsNavbar } from "react-bootstrap";

export default function Navbar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const closeNav = () => setExpanded(false);

  return (
    <BsNavbar
      expand="lg"
      expanded={expanded}
      onToggle={setExpanded}
      className="navbar-dark navbar-custom py-2 sticky-top"
    >
      <Container>
        <BsNavbar.Brand as={Link} href="/" onClick={closeNav}>
          DagrAI
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="main-nav" />
        <BsNavbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              href="/pricing"
              active={pathname === "/pricing"}
              onClick={closeNav}
            >
              Pricing
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/docs"
              active={pathname === "/docs"}
              onClick={closeNav}
            >
              Docs
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link
              as={Link}
              href="/login"
              className="me-2"
              onClick={closeNav}
            >
              Sign In
            </Nav.Link>
            <Link
              href="/signup"
              onClick={closeNav}
              style={{
                background: "var(--brand)",
                color: "#fff",
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "0.85rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Get Started
            </Link>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
