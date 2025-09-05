// src/lib/stripe/server.ts
import Stripe from "stripe";

// Node.js-Stripe-Instanz für Server-Routen
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export default stripe;
