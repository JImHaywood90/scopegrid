// app/api/matching/exclusions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productMatchExclusions } from '@/lib/db/schema.v2';
import { and, eq } from 'drizzle-orm';
import { getAppSession } from '@frontegg/nextjs/app';

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

async function feTenantId() {
  const s = await getAppSession();
  const id = s?.user?.tenantId ?? (s?.user as any)?.tenantIds?.[0];
  if (!id) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return id;
}

// Create an exclusion
export async function POST(req: NextRequest) {
  try {
    const feTenant = await feTenantId();
    const { companyIdentifier, entityType, entityId, reason } = await req.json();
    if (!companyIdentifier || !entityType || !entityId) return bad('Missing fields');
    await db.insert(productMatchExclusions).values({
      feTenantId: feTenant,
      companyIdentifier,
      entityType,
      entityId: Number(entityId),
      reason: reason ?? null,
    }).onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: e?.status ?? 500 });
  }
}

// Remove an exclusion
export async function DELETE(req: NextRequest) {
  try {
    const feTenant = await feTenantId();
    const { searchParams } = new URL(req.url);
    const companyIdentifier = searchParams.get('companyIdentifier');
    const entityType = searchParams.get('entityType');
    const entityId = Number(searchParams.get('entityId') || '0');
    if (!companyIdentifier || !entityType || !entityId) return bad('Missing params');
    await db.delete(productMatchExclusions).where(
      and(
        eq(productMatchExclusions.feTenantId, feTenant),
        eq(productMatchExclusions.companyIdentifier, companyIdentifier),
        eq(productMatchExclusions.entityType, entityType),
        eq(productMatchExclusions.entityId, entityId),
      )
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: e?.status ?? 500 });
  }
}
