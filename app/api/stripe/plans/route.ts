import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';

export const runtime = 'nodejs';

function splitFeatures(s?: string): string[] {
  if (!s) return [];
  return s.split(/\r?\n|[|,•]/g).map((x) => x.trim()).filter(Boolean);
}

function extractFeatures(prod: Stripe.Product, price?: Stripe.Price): string[] {
  const mf = (prod as any).marketing_features as Array<{ name?: string }> | undefined;
  const fromMarketing = Array.isArray(mf) ? mf.map((f) => (f?.name ?? '').trim()).filter(Boolean) : [];
  if (fromMarketing.length) return fromMarketing;

  const fromProdMeta = splitFeatures(prod.metadata?.features);
  if (fromProdMeta.length) return fromProdMeta;

  const fromPriceMeta = splitFeatures(price?.metadata?.features);
  if (fromPriceMeta.length) return fromPriceMeta;

  return splitFeatures(prod.description ?? '');
}

export async function GET() {
  const res = await stripe.prices.list({
    active: true,
    type: 'recurring',
    expand: ['data.product'],
    limit: 100,
  });

  const plans = res.data
    .map((price) => {
      const product = typeof price.product === 'string' ? null : (price.product as Stripe.Product | Stripe.DeletedProduct);
      if (!product || ('deleted' in product && product.deleted)) return null;
      const prod = product as Stripe.Product;
      if (prod.active === false) return null;

      // Stripe trials: set on the Price (most common)
      const trialDays = (price as any).trial_period_days as number | null | undefined;

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
        trialDays: trialDays ?? undefined,
      };
    })
    .filter(Boolean);

  return NextResponse.json(plans);
}
