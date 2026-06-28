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

    // Find user — listUsers paginates, so we need to iterate pages
    let user: { id: string; email?: string } | undefined;
    let page = 1;
    while (!user && page <= 5) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
      if (!data?.users?.length) break;
      user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      page++;
    }

    if (!user) return NextResponse.json({ sent: true }); // user not found, don't reveal

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("email_confirmations").insert({
      user_id: user.id, email, token, expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Failed to insert confirmation token:", insertError);
      return NextResponse.json({ sent: false, error: insertError.message });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dagrai.xyz";
    const confirmUrl = `${base}/confirm?token=${token}`;

    await sendConfirmation(email, confirmUrl);
    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error("send-welcome error:", e);
    return NextResponse.json({ sent: false });
  }
}
