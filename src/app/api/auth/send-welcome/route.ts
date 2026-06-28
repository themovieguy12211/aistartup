import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { sendConfirmation } from "@/lib/email";

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

    // Try to get confirmation link from Supabase
    let confirmUrl = "https://dagrai.xyz/login";
    try {
      const supabase = await createServiceSupabase();
      // generateLink with "signup" type works even for existing unconfirmed users
      const { data: linkData } = await (supabase.auth.admin as any).generateLink({
        type: "signup",
        email,
        password: "placeholder-not-used-for-existing",
        options: { redirectTo: "https://dagrai.xyz/login" },
      });
      if (linkData?.properties?.action_link) {
        confirmUrl = linkData.properties.action_link;
      }
    } catch {
      // Fall back to generic login link — user may already be confirmed
    }

    await sendConfirmation(email, confirmUrl);
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ sent: false });
  }
}
