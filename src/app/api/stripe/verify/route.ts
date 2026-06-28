import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServiceSupabase } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const creditAmount = parseFloat(session.metadata?.creditAmount || "0");
    const sessionUserId = session.metadata?.userId;

    if (sessionUserId !== (user.id as string)) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    if (creditAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const supabase = await createServiceSupabase();

    // INSERT first — UNIQUE constraint prevents double-credit race conditions.
    // If this fails with a duplicate key, the charge was already processed.
    const { error: insertError } = await supabase
      .from("stripe_charges")
      .insert({
        stripe_session_id: sessionId,
        user_id: user.id,
        amount: creditAmount,
      });

    if (insertError) {
      // Already credited — idempotent, return success
      return NextResponse.json({ success: true, alreadyCredited: true });
    }

    // Read current credits and add the purchased amount
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newCredits = +(profile.credits + creditAmount).toFixed(8);
    await supabase.from("profiles").update({ credits: newCredits }).eq("id", user.id);

    return NextResponse.json({ success: true, newCredits });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Stripe verify error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
