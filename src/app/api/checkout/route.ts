import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { priceId } = await req.json();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop`,
  });
  return NextResponse.json({ id: session.id });
}
