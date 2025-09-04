"use client";

import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ShopPage() {
  async function handleBuy(priceId: string) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const { id } = await res.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId: id });
  }

  return (
    <main className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Shop</h1>
      <button
        onClick={() => handleBuy('price_123')}
        className="btn-primary"
      >
        Jetzt kaufen
      </button>
    </main>
  );
}
