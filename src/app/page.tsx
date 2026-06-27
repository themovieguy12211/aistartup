"use client";

import { useSession } from "@/lib/use-session";
import { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import ChatInterface from "@/components/ChatInterface";
import GuestChat from "@/components/GuestChat";
import ChatNavbar from "@/components/ChatNavbar";

export default function Home() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      const r = await fetch("/api/usage");
      if (r.ok) {
        const d = await r.json();
        setCredits(d.credits);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCredits();
    }
  }, [status, fetchCredits]);

  // Loading
  if (status === "loading") {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  // Always show chat — guest or authenticated
  return (
    <>
      <ChatNavbar credits={credits} onCreditsChange={fetchCredits} />
      {status === "authenticated" ? (
        <ChatInterface credits={credits} onCreditsChange={fetchCredits} />
      ) : (
        <GuestChat />
      )}
    </>
  );
}
