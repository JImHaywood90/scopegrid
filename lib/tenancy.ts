// lib/tenancy.ts
import { db } from "@/lib/db/drizzle";
import { tenants, tenantSettings } from "@/lib/db/schema.v2";
import { eq } from "drizzle-orm";

export async function upsertTenantRow(input: {
  feTenantId: string;
  name?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeProductId?: string | null;
  planName?: string | null;
  subscriptionStatus?: string | null;
}) {
  await db
    .insert(tenants)
    .values({
      feTenantId: input.feTenantId,
      name: input.name ?? null,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      stripeProductId: input.stripeProductId ?? null,
      planName: input.planName ?? null,
      subscriptionStatus: input.subscriptionStatus ?? null,
    })
    .onConflictDoUpdate({
      target: tenants.feTenantId,
      set: {
        name: input.name ?? null,
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        stripeProductId: input.stripeProductId ?? null,
        planName: input.planName ?? null,
        subscriptionStatus: input.subscriptionStatus ?? null,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(tenantSettings)
    .values({ feTenantId: input.feTenantId })
    .onConflictDoNothing();
}

export async function patchTenantByCustomerId(
  stripeCustomerId: string,
  patch: Partial<{
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string | null;
  }>
) {
  const existing = await db.query.tenants.findFirst({
    where: eq(tenants.stripeCustomerId, stripeCustomerId),
  });
  if (!existing) return;

  await db
    .update(tenants)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(tenants.feTenantId, existing.feTenantId));
}
