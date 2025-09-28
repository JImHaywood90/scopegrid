'use server';

import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signSignupPayload } from '@/lib/stripe/signupToken';

export async function listPlans() {
  const res = await stripe.prices.list({
    active: true,
    expand: ['data.product'],
    limit: 100,
  });

  const subs = res.data
    .filter((p) => p.type === 'recurring')
    .map((p) => {
      const product =
        typeof p.product === 'string' ? null : (p.product as Stripe.Product | Stripe.DeletedProduct);
      // Skip if we didn’t expand or product is deleted
      if (!product || ('deleted' in product && product.deleted)) {
        return null;
      }
      const prod = product as Stripe.Product;

      return {
        priceId: p.id,
        nickname: p.nickname || prod.name,
        interval: p.recurring?.interval as 'month' | 'year' | undefined,
        unitAmount: p.unit_amount ?? 0,
        currency: p.currency,
        productName: prod.name,
        productDesc: prod.description ?? '',
        features: (prod.metadata?.features || '').split('|').filter(Boolean),
        productId: prod.id,
      };
    })
    .filter(Boolean) as Array<{
      priceId: string;
      nickname?: string;
      interval?: 'month' | 'year';
      unitAmount: number;
      currency: string;
      productName: string;
      productDesc: string;
      features: string[];
      productId: string;
    }>;

  return subs;
}

type StartCheckoutArgs = {
  priceId: string;
  email: string;
  successPath?: string;
  cancelPath?: string;
};

export async function startCheckout({
  priceId,
  email,
  successPath = '/welcome',
  cancelPath = '/pricing',
}: StartCheckoutArgs) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const clientRef = signSignupPayload({ email, planId: priceId, iat: Date.now() });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: clientRef,
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}${cancelPath}`,
  });

  (await cookies()).set('sg.signup_hint', email, { httpOnly: true, sameSite: 'lax', maxAge: 3600 });

  redirect(session.url!);
}
