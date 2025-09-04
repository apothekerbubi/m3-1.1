import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (userId) {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ subscription_active: true })
        .eq('id', userId);
    }
  }

  return NextResponse.json({ received: true });
}
