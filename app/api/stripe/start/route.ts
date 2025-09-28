import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { signSignupPayload } from '@/lib/stripe/signupToken';

export const runtime = 'nodejs';

type Body = {
  priceId: string;
  successPath?: string;
  cancelPath?: string;
};

export async function POST(req: Request) {
  try {
    const { priceId, successPath = '/welcome', cancelPath = '/' } = (await req.json()) as Body;
    if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });

    // Optional: infer a trial from metadata (price or product), or default (e.g., 14)
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    const product = typeof price.product === 'string' ? null : price.product;
    const trialFromMeta =
      Number(price.metadata?.trial_days) ||
      7; // 0 -> no trial

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const clientRef = signSignupPayload({ planId: priceId, iat: Date.now() });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: clientRef,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      // 👇 Trials belong here now. Use one of the two options:

      // Simple: fixed length trial
      ...(trialFromMeta > 0
        ? { subscription_data: { trial_period_days: trialFromMeta } }
        : {}),

      // Advanced (alternative): trial_settings (uncomment if you need special behavior)
      // subscription_data: {
      //   trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      //   trial_period_days: trialFromMeta || undefined,
      // },

      success_url: `${appUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${cancelPath}`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: any) {
    console.error('POST /api/stripe/start failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
  }
}
