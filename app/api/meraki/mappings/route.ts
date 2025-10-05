import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@frontegg/nextjs/app';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { merakiOrgMappings } from '@/lib/db/schema.v2';

export const runtime = 'nodejs';

async function requireFeTenantId(): Promise<string> {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  return feTenantId;
}

export async function GET(req: NextRequest) {
  try {
    const feTenantId = await requireFeTenantId();
    const companyIdentifier = req.nextUrl.searchParams.get('companyIdentifier')?.trim() || '';

    const conditions = [eq(merakiOrgMappings.feTenantId, feTenantId)];
    if (companyIdentifier) {
      conditions.push(eq(merakiOrgMappings.companyIdentifier, companyIdentifier));
    }

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const rows = await db
      .select()
      .from(merakiOrgMappings)
      .where(where)
      .orderBy(merakiOrgMappings.merakiOrgName);

    return NextResponse.json({ items: rows });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ error: err?.message ?? 'Failed to load mappings' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const feTenantId = await requireFeTenantId();
    const body = await req.json().catch(() => ({}));

    const merakiOrgIdRaw = body?.merakiOrgId;
    const merakiOrgNameRaw = body?.merakiOrgName;
    const companyIdentifierRaw = body?.companyIdentifier;
    const companyNameRaw = body?.companyName;

    const merakiOrgId = typeof merakiOrgIdRaw === 'string' ? merakiOrgIdRaw.trim() : '';
    const merakiOrgName = typeof merakiOrgNameRaw === 'string' ? merakiOrgNameRaw.trim() : '';
    const companyIdentifier = typeof companyIdentifierRaw === 'string' ? companyIdentifierRaw.trim() : '';
    const companyName = typeof companyNameRaw === 'string' ? companyNameRaw.trim() : '';

    if (!merakiOrgId || !merakiOrgName || !companyIdentifier) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const now = new Date();

    await db
      .insert(merakiOrgMappings)
      .values({
        feTenantId,
        merakiOrgId,
        merakiOrgName,
        companyIdentifier,
        companyName: companyName || null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [merakiOrgMappings.feTenantId, merakiOrgMappings.merakiOrgId],
        set: {
          merakiOrgName,
          companyIdentifier,
          companyName: companyName || null,
          updatedAt: now,
        },
      });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ error: err?.message ?? 'Failed to save mapping' }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const feTenantId = await requireFeTenantId();
    const orgId = req.nextUrl.searchParams.get('orgId')?.trim() || '';
    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    await db
      .delete(merakiOrgMappings)
      .where(
        and(
          eq(merakiOrgMappings.feTenantId, feTenantId),
          eq(merakiOrgMappings.merakiOrgId, orgId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ error: err?.message ?? 'Failed to delete mapping' }, { status });
  }
}
