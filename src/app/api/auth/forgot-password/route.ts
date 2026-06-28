import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { sendPasswordReset } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const supabase = await createServiceSupabase();

    const { data: { users }, error: findError } = await supabase.auth.admin.listUsers();
    if (findError) return NextResponse.json({ error: "Internal error" }, { status: 500 });

    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json({ sent: true }); // Don't reveal existence
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({ user_id: user.id, token, expires_at: expiresAt });

    if (insertError) return NextResponse.json({ error: "Internal error" }, { status: 500 });

    // Send via Resend
    try {
      await sendPasswordReset(email, token);
    } catch {
      // Email failed but token is valid — return the link for manual use
      const origin = req.headers.get("origin") || "https://dagrai.xyz";
      return NextResponse.json({ sent: true, resetLink: `${origin}/reset-password?token=${token}` });
    }

    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
