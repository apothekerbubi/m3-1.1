// src/lib/stripe/server.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil", // aktuelle Stripe API-Version (kannst im Dashboard checken)
});