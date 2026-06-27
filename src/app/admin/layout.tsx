"use client";

import { useSession, signOut } from "@/lib/use-session";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Nav, Spinner } from "react-bootstrap";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && role !== "admin") {
      router.push("/");
    }
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  if (!session || role !== "admin") return null;

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <div
        className="sidebar d-flex flex-column flex-shrink-0 p-3"
        style={{ width: "220px" }}
      >
        <Link
          href="/"
          className="text-decoration-none mb-1 px-2"
          style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}
        >
          DagrAI
        </Link>
        <div
          className="px-2 mb-3"
          style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}
        >
          Admin
        </div>

        <Nav className="flex-column">
          {navItems.map((item) => (
            <Nav.Link
              key={item.href}
              as={Link}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
              style={{ fontSize: "0.9rem" }}
            >
              {item.label}
            </Nav.Link>
          ))}
        </Nav>

        <div className="mt-auto pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="px-2 mb-2" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {session.user?.email}
          </div>
          <button
            onClick={() => signOut().then(() => { window.location.href = "/"; })}
            style={{ fontSize: "0.82rem", background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", width: "100%" }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex-grow-1 p-4" style={{ overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
