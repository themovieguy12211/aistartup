import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const creditAmount = parseFloat(session.metadata?.creditAmount || "0");

    if (userId && creditAmount > 0) {
      const supabase = await createServiceSupabase();

      // Read current credits and add the purchased amount
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (profile) {
        const newCredits = +(profile.credits + creditAmount).toFixed(8);
        await supabase
          .from("profiles")
          .update({ credits: newCredits })
          .eq("id", userId);

        console.log(`Stripe: Added $${creditAmount} to user ${userId}. New balance: $${newCredits.toFixed(4)}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
