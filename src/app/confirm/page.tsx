import { Metadata } from "next";
import Link from "next/link";
import { createServiceSupabase } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Confirm Email — DagrAI" };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let status: "success" | "invalid" | "expired" | "error" = "invalid";

  if (token) {
    try {
      const supabase = await createServiceSupabase();
      const { data: confirmation } = await supabase
        .from("email_confirmations")
        .select("*")
        .eq("token", token)
        .eq("confirmed", false)
        .single();

      if (!confirmation) {
        status = "invalid";
      } else if (new Date(confirmation.expires_at) < new Date()) {
        status = "expired";
      } else {
        await supabase.auth.admin.updateUserById(confirmation.user_id, { email_confirm: true });
        await supabase.from("email_confirmations").update({ confirmed: true }).eq("id", confirmation.id);
        status = "success";
      }
    } catch {
      status = "error";
    }
  }

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: "440px", textAlign: "center", padding: "40px" }}>
        {status === "success" && (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>✓</div>
            <h2 style={{ fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>Email Verified</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              Your email has been confirmed. You can now sign in.
            </p>
            <Link href="/login" style={{
              background: "var(--brand)", color: "#fff", borderRadius: "6px",
              padding: "10px 28px", fontWeight: 500, textDecoration: "none", display: "inline-block",
            }}>
              Sign In
            </Link>
          </>
        )}

        {(status === "invalid" || status === "expired") && (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "16px", color: "var(--text-muted)" }}>✗</div>
            <h2 style={{ fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>
              {status === "expired" ? "Link Expired" : "Invalid Link"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              {status === "expired"
                ? "This confirmation link has expired. Please sign up again."
                : "This confirmation link is invalid or has already been used."}
            </p>
            <Link href="/signup" style={{
              background: "var(--brand)", color: "#fff", borderRadius: "6px",
              padding: "10px 28px", fontWeight: 500, textDecoration: "none", display: "inline-block",
            }}>
              Sign Up
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              Something went wrong. Please try signing up again.
            </p>
            <Link href="/signup" style={{
              background: "var(--brand)", color: "#fff", borderRadius: "6px",
              padding: "10px 28px", fontWeight: 500, textDecoration: "none", display: "inline-block",
            }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
