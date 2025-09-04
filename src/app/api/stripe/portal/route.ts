// src/app/api/stripe/create-portal-session/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createClient();

    // 1) Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Profil holen (RLS-freundlich, kein Admin nötig)
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id) // <-- korrekt laut deinem Schema
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "no-stripe-customer" }, { status: 400 });
    }

    // 3) Portal-Session erstellen
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://exasim.de";
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/account`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("create-portal-session error:", e);
    return NextResponse.json({ error: "portal-failed" }, { status: 500 });
  }
}