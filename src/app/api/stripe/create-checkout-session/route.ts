import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const admin = createAdminClient();

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Profil laden
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    // Falls noch keine Stripe-Customer-ID existiert → anlegen
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        metadata: { supabaseUserId: user.id },
      });

      customerId = customer.id;

      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);

      console.log(`✅ Neuer Stripe-Customer erstellt: ${customerId}`);
    }

    // Checkout-Session erzeugen
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, // deine Price-ID hier
          quantity: 1,
        },
      ],
      customer: customerId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("❌ Fehler bei create-checkout-session:", e);
    return NextResponse.json({ error: "checkout-failed" }, { status: 500 });
  }
}