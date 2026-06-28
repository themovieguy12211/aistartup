import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const supabase = await createServiceSupabase();

    const REDIRECT_BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://dagrai.xyz";

    // Find and verify our token
    const { data: confirmation } = await supabase
      .from("email_confirmations")
      .select("*")
      .eq("token", token)
      .eq("confirmed", false)
      .single();

    if (!confirmation) {
      return NextResponse.redirect(`${REDIRECT_BASE}/login?error=invalid_token`);
    }

    if (new Date(confirmation.expires_at) < new Date()) {
      return NextResponse.redirect(`${REDIRECT_BASE}/login?error=expired_token`);
    }

    // Confirm the user in Supabase
    await supabase.auth.admin.updateUserById(confirmation.user_id, {
      email_confirm: true,
    });

    // Mark token as used
    await supabase
      .from("email_confirmations")
      .update({ confirmed: true })
      .eq("id", confirmation.id);

    return NextResponse.redirect(`${REDIRECT_BASE}/login?verified=true`);
  } catch (e) {
    console.error("confirm error:", e);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "https://dagrai.xyz"}/login?error=confirm_failed`);
  }
}
