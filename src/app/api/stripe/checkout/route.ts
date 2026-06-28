import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { amount } = await req.json();

    if (!amount || amount < 5) {
      return NextResponse.json({ error: "Minimum top-up is $5.00" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://dagrai.xyz";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `DagrAI Credits — $${amount.toFixed(2)}`,
            description: `Add $${amount.toFixed(2)} in credits to your DagrAI account.`,
          },
          unit_amount: Math.round(amount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id as string,
        creditAmount: String(amount),
      },
      success_url: `${origin}/dashboard/billing?success=true&amount=${amount}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Stripe checkout error:", msg);
    return NextResponse.json({ error: msg || "Failed to create checkout session" }, { status: 500 });
  }
}
