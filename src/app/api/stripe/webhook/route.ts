import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

const admin = createAdminClient();

async function upsertSubscription(customerId: string, subscriptionId: string) {
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

  const tier =
    (subscription.items.data[0]?.price?.nickname as string | undefined) || null;

  // Supabase aktualisieren
  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_tier: tier,
      subscription_start: start.toISOString(),
      current_period_end: end.toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("❌ Supabase update failed", error);
  } else {
    console.log("✅ Subscription gespeichert in Supabase");
  }
}

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

    // 👇 Abo erstellt oder erneuert (Checkout)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      await upsertSubscription(customerId, subscriptionId);
    }

    // 👇 Abo wurde in Stripe angelegt (sicherheitsnetz)
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      await upsertSubscription(customerId, subscription.id);
    }

    // 👇 Folgezahlungen bei bestehendem Abo
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const sub = invoice.subscription_details?.subscription;
      const subscriptionId = typeof sub === "string" ? sub : sub?.id;

      if (subscriptionId) {
        await upsertSubscription(customerId, subscriptionId);
      }
    }

    // 👇 Abo gekündigt oder ausgelaufen
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId = subscription.customer as string;

      await admin
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_tier: null,
          current_period_end: new Date().toISOString(),
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
