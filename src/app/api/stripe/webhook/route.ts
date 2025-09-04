import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

const admin = createAdminClient();

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // 👇 Abo erstellt oder erneuert
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Hole das Abo aus Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const start = new Date(subscription.current_period_start * 1000);
      const end = new Date(subscription.current_period_end * 1000);

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
      const subscription = event.data.object as any;

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