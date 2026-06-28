import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const supabase = await createServiceSupabase();

    // Find and verify our token
    const { data: confirmation } = await supabase
      .from("email_confirmations")
      .select("*")
      .eq("token", token)
      .eq("confirmed", false)
      .single();

    if (!confirmation) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));
    }

    if (new Date(confirmation.expires_at) < new Date()) {
      return NextResponse.redirect(new URL("/login?error=expired_token", req.url));
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

    // Redirect to login with success
    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=confirm_failed", req.url));
  }
}
