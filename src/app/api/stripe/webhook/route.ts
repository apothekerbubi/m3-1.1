import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log("👉 Event empfangen:", event.type);

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      // 👇 Typ erweitern, damit TS `current_period_end` & `start_date` kennt
      const subscription = event.data.object as Stripe.Subscription & {
        current_period_end?: number;
        start_date?: number;
      };

      const supabase = supabaseAdmin;

      const item = subscription.items?.data?.[0];
      const priceId = item?.price?.id ?? null;
      const productId = (item?.price?.product as string) ?? null;

      let productName: string | null = null;
      if (productId) {
        try {
          const product = await stripe.products.retrieve(productId);
          productName = product?.name ?? null;
        } catch (e) {
          console.error("❌ Konnte Produkt nicht laden:", e);
        }
      }

      const updateData = {
        stripe_customer_id: String(subscription.customer),
        abo_start: subscription.start_date
          ? new Date(subscription.start_date * 1000).toISOString()
          : null,
        abo_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        abo_name: productName,
        abo_price_id: priceId,
      };

      const userId = subscription.metadata?.user_id;
      if (!userId) {
        console.error("❌ Kein user_id im subscription.metadata gefunden!");
      } else {
        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", userId);

        if (error) {
          console.error("❌ Supabase Update Fehler:", error);
        } else {
          console.log("✅ Subscription in Supabase aktualisiert");
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook Fehler:", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}