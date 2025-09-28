'use server';

import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { redirect } from 'next/navigation';
import { signSignupPayload } from '@/lib/stripe/signupToken';

function splitFeatures(s?: string): string[] {
  if (!s) return [];
  return s
    .split(/\r?\n|[|,•]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function extractFeatures(prod: Stripe.Product, price?: Stripe.Price): string[] {
  const mf = (prod as any).marketing_features as Array<{ name?: string }> | undefined;
  const fromMarketing = Array.isArray(mf)
    ? mf.map((f) => (f?.name ?? '').trim()).filter(Boolean)
    : [];
  if (fromMarketing.length) return fromMarketing;

  const fromProdMeta = splitFeatures(prod.metadata?.features);
  if (fromProdMeta.length) return fromProdMeta;

  const fromPriceMeta = splitFeatures(price?.metadata?.features);
  if (fromPriceMeta.length) return fromPriceMeta;

  return splitFeatures(prod.description ?? '');
}

export async function listPlans() {
  const res = await stripe.prices.list({
    active: true,
    type: 'recurring',
    expand: ['data.product'],
    limit: 100,
  });

  return res.data
    .map((price) => {
      const product = typeof price.product === 'string' ? null : (price.product as Stripe.Product | Stripe.DeletedProduct);
      if (!product || ('deleted' in product && product.deleted)) return null;
      const prod = product as Stripe.Product;
      if (prod.active === false) return null;

      return {
        priceId: price.id,
        nickname: price.nickname || prod.name,
        interval: price.recurring?.interval as 'month' | 'year' | undefined,
        unitAmount: price.unit_amount ?? 0,
        currency: price.currency,
        productName: prod.name,
        productDesc: prod.description ?? '',
        features: extractFeatures(prod, price),
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
}

export async function startCheckout({ priceId, successPath = '/welcome', cancelPath = '/' }:
  { priceId: string; successPath?: string; cancelPath?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const clientRef = signSignupPayload({ planId: priceId, iat: Date.now() });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: clientRef,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}${cancelPath}`,
  });

  redirect(session.url!);
}

/** Server Action that works with `<form action>` from a Client Component */
export async function startCheckoutAction(formData: FormData) {
  const priceId = String(formData.get('priceId') || '');
  if (!priceId) throw new Error('Missing priceId');
  await startCheckout({ priceId });
}
