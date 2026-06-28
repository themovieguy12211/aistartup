import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { sendConfirmation } from "@/lib/email";
import crypto from "crypto";

const signupRateMap = new Map<string, { count: number; resetAt: number }>();
const MAX_SIGNUPS = 3;
const WINDOW_MS = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of signupRateMap) {
    if (now > entry.resetAt) signupRateMap.delete(ip);
  }
}, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const entry = signupRateMap.get(ip);
    if (entry && now < entry.resetAt && entry.count >= MAX_SIGNUPS) {
      return NextResponse.json({ error: "Too many signups. Try again later." }, { status: 429 });
    }
    if (!entry || now > entry.resetAt) {
      signupRateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count++;
    }

    const supabase = await createServiceSupabase();

    // Find the user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return NextResponse.json({ sent: true }); // don't reveal

    // Generate our own confirmation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await supabase.from("email_confirmations").insert({
      user_id: user.id,
      email,
      token,
      expires_at: expiresAt,
    });

    // Build OUR url — always use the real domain, not the request origin
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dagrai.xyz";
    const confirmUrl = `${base}/api/auth/confirm?token=${token}`;

    await sendConfirmation(email, confirmUrl);
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ sent: false });
  }
}
