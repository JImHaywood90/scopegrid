// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db/drizzle';
import { tenants, tenantSettings } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';
import { getMgmtToken } from '@/lib/frontegg/fronteggMgmt';
import { ensureTenantRecord } from '@/lib/frontegg/ensureTenantRecord';


export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Utility: safely get customer email
async function getStripeCustomerEmail(customerId?: string | null) {
  if (!customerId) return undefined;
  const cust = await stripe.customers.retrieve(customerId);
  if ('deleted' in cust && cust.deleted) return undefined;
  return (cust as Stripe.Customer).email ?? undefined;
}

async function updateTenantByCustomerId(customerId: string, patch: Partial<{
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
}>) {
  const existing = await db.query.tenants.findFirst({
    where: eq(tenants.stripeCustomerId, customerId),
  });
  if (!existing) return;
  await db.update(tenants).set({ ...patch, updatedAt: new Date() })
    .where(eq(tenants.feTenantId, existing.feTenantId));
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, WH_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = (session.customer as string) || null;
        const subscriptionId = (session.subscription as string) || null;

        // get product/plan
        let productId: string | null = null;
        let planName: string | null = null;

        if (session.mode === 'subscription') {
          const full = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items.data.price.product'],
          });
          const price = full.line_items?.data?.[0]?.price;
          const product = price?.product as Stripe.Product | string | undefined;
          productId = typeof product === 'string' ? product : product?.id ?? null;
          planName = (price?.nickname as string) || (price?.id ?? null);
        }

        const userEmail = await getStripeCustomerEmail(customerId);
        const feTenantId = session.metadata?.feTenantId as string | undefined;

        await ensureTenantRecord({
          feTenantId: session.metadata?.feTenantId ?? null, // if you passed it to Checkout
          tenantName: session.customer_details?.name || null,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeProductId: productId,
          planName,
          subscriptionStatus: 'active',
          userEmail, // pulled via Stripe API for the customer
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const price = sub.items.data[0]?.price;
        const product = price?.product as Stripe.Product | string | undefined;
        const productId = typeof product === 'string' ? product : product?.id ?? null;
        const planName = (price?.nickname as string) || (price?.id ?? null);

        await updateTenantByCustomerId(customerId, {
          stripeSubscriptionId: sub.id,
          stripeProductId: productId,
          planName,
          subscriptionStatus: sub.status,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await updateTenantByCustomerId(sub.customer as string, {
          stripeSubscriptionId: sub.id,
          subscriptionStatus: 'canceled',
        });
        break;
      }

      default:
        // ignore others
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[stripe:webhook] handler error:', err?.message || err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
