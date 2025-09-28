// lib/billing/ensureTenantRecord.ts
import { db } from '@/lib/db/drizzle';
import { tenants, tenantSettings } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';

import { getAdminRoleId } from '@/lib/frontegg/roles';
import { getMgmtToken } from './fronteggMgmt';

/**
 * Provision a Frontegg tenant (and first user) if needed, then upsert
 * billing fields into Neon. Returns the resolved Frontegg tenant id.
 */
export async function ensureTenantRecord(opts: {
  feTenantId?: string | null;
  tenantName?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeProductId?: string | null;
  planName?: string | null;
  subscriptionStatus?: string | null;
  userEmail?: string | undefined;
}) {
  let feTenantId = opts.feTenantId ?? undefined;

  // 1) Provision Frontegg tenant (and user) when missing
  if (!feTenantId) {
    try {
      const bearer = await getMgmtToken();

      // Create tenant
      const tRes = await fetch('https://api.frontegg.com/tenants/resources/tenants/v1', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify({
          name: opts.tenantName || 'New Customer',
          externalId: opts.stripeCustomerId || undefined,
        }),
      });
      if (!tRes.ok) throw new Error(await tRes.text());
      const tJson = await tRes.json() as any;

      // Normalize id field (some responses use id, some tenantId)
      feTenantId = tJson?.tenantId;
      if (!feTenantId) throw new Error(`createTenant: missing id in ${JSON.stringify(tJson)}`);

      // (tiny consistency wait)
      await new Promise((r) => setTimeout(r, 250));

      // Create first user with Admin role if we have an email
      if (opts.userEmail) {
        const adminRoleId = await getAdminRoleId(bearer); // may be null
        const payload: Record<string, any> = {
          email: opts.userEmail,
          name: opts.userEmail,
          tenantId: feTenantId,
          ...(adminRoleId ? { roleIds: [adminRoleId] } : {}),
        };

        // retry a couple times for eventual consistency
        let ok = false;
        for (let i = 0; i < 3 && !ok; i++) {
          const uRes = await fetch('https://api.frontegg.com/identity/resources/vendor-only/users/v1', {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
            body: JSON.stringify(payload),
          });
          ok = uRes.ok;
          if (!ok) await new Promise((r) => setTimeout(r, 250 + i * 200));
        }
      }
    } catch (e) {
      console.error('[ensureTenantRecord] provisioning error:', e);
    }
  }

  // 2) If still no tenant id, bail gracefully (don’t crash webhook)
  if (!feTenantId) {
    console.warn('[ensureTenantRecord] no feTenantId; skipping DB upsert');
    return undefined;
  }

  // 3) Upsert tenant billing fields in Neon
  await db
    .insert(tenants)
    .values({
      feTenantId,
      name: opts.tenantName ?? null,
      stripeCustomerId: opts.stripeCustomerId ?? null,
      stripeSubscriptionId: opts.stripeSubscriptionId ?? null,
      stripeProductId: opts.stripeProductId ?? null,
      planName: opts.planName ?? null,
      subscriptionStatus: opts.subscriptionStatus ?? null,
    })
    .onConflictDoUpdate({
      target: tenants.feTenantId,
      set: {
        name: opts.tenantName ?? null,
        stripeCustomerId: opts.stripeCustomerId ?? null,
        stripeSubscriptionId: opts.stripeSubscriptionId ?? null,
        stripeProductId: opts.stripeProductId ?? null,
        planName: opts.planName ?? null,
        subscriptionStatus: opts.subscriptionStatus ?? null,
        updatedAt: new Date(),
      },
    });

  // 4) Ensure tenant_settings row exists
  await db
    .insert(tenantSettings)
    .values({
      feTenantId,
      onboardingCompleted: false,
      cwConfigured: false,
    })
    .onConflictDoNothing();

  return feTenantId;
}
