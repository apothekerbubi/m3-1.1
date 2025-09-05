import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 👇 PriceId aus Body entgegennehmen
    const { priceId } = await req.json();
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/account?success=true`,
      cancel_url: `${appUrl}/shop?canceled=true`,
      customer_email: user.email ?? undefined,
      subscription_data: {
        metadata: {
          user_id: user.id, // 👈 landet direkt an der Subscription
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("❌ Fehler bei create-checkout-session:", err);
    return NextResponse.json({ error: "session-failed" }, { status: 500 });
  }
}