import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

const admin = createAdminClient();

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // 👇 Abo erstellt oder erneuert
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Hole das Abo aus Stripe
      type SubscriptionWithPeriod = Stripe.Subscription & {
        current_period_start?: number;
        current_period_end?: number;
        current_period?: { start: number; end: number };
      };

      const subscription = (await stripe.subscriptions.retrieve(
        subscriptionId,
      )) as SubscriptionWithPeriod;

      const startUnix =
        subscription.current_period_start ?? subscription.current_period?.start;
      const endUnix =
        subscription.current_period_end ?? subscription.current_period?.end;
      if (typeof startUnix !== "number" || typeof endUnix !== "number") {
        throw new Error("Missing subscription period");
      }
      const start = new Date(startUnix * 1000);
      const end = new Date(endUnix * 1000);

      // Supabase aktualisieren
      await admin
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_start: start.toISOString(),
          subscription_end: end.toISOString(),
        })
        .eq("stripe_customer_id", customerId);

      console.log("✅ Subscription gespeichert in Supabase");
    }

    // 👇 Abo gekündigt oder ausgelaufen
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId = subscription.customer as string;

      await admin
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_end: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);

      console.log("❌ Subscription beendet");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook-Error", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
