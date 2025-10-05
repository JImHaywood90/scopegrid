// app/api/matching/override/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { productMatchOverrides } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';

export const runtime = 'nodejs';

async function requireFeTenantId(): Promise<string> {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return feTenantId;
}

export async function POST(req: NextRequest) {
  try {
    const feTenantId = await requireFeTenantId();

    const body = await req.json().catch(() => ({}));
    const {
      productSlug,
      catalogId,
      terms,
      companyIdentifier,
      scope,
      mode,
    } = body as {
      productSlug?: string;
      catalogId?: string | number | null;
      terms?: string[] | string;
      companyIdentifier?: string | null;
      scope?: 'tenant' | 'company';
      mode?: 'append' | 'replace';
    };

    if (!productSlug || typeof productSlug !== 'string') {
      return NextResponse.json({ error: 'productSlug required' }, { status: 400 });
    }

    const normalizedScope = scope === 'company' ? 'company' : 'tenant';
    const normalizedCompany = normalizedScope === 'company'
      ? (typeof companyIdentifier === 'string' && companyIdentifier.trim().length
          ? companyIdentifier.trim()
          : null)
      : null;

    if (normalizedScope === 'company' && !normalizedCompany) {
      return NextResponse.json({ error: 'companyIdentifier required for company scope' }, { status: 400 });
    }

    const catalogIdValue = catalogId == null ? null : Number(catalogId);
    if (catalogId != null && Number.isNaN(catalogIdValue)) {
      return NextResponse.json({ error: 'catalogId must be numeric' }, { status: 400 });
    }

    // normalize terms -> lowercased + unique
    const raw = Array.isArray(terms) ? terms : typeof terms === 'string' ? terms.split(',') : [];
    const cleaned = Array.from(
      new Set(
        raw
          .map((s) => (typeof s === 'string' ? s.trim() : ''))
          .filter(Boolean)
          .map((s) => s.toLowerCase())
      )
    );

    if (!cleaned.length) {
      return NextResponse.json({ error: 'At least one term required' }, { status: 400 });
    }

    const whereClause = and(
      eq(productMatchOverrides.feTenantId, feTenantId),
      eq(productMatchOverrides.productSlug, productSlug),
      normalizedCompany === null
        ? isNull(productMatchOverrides.companyIdentifier)
        : eq(productMatchOverrides.companyIdentifier, normalizedCompany)
    );

    if (mode === 'replace') {
      // Try UPDATE first
      const updated = await db
        .update(productMatchOverrides)
        .set({
          terms: cleaned,
          updatedAt: new Date(),
          ...(catalogIdValue != null ? { catalogId: catalogIdValue } : {}),
          companyIdentifier: normalizedCompany,
        })
        .where(whereClause)
        .returning({ id: productMatchOverrides.id });

      if (updated.length > 0) {
        return NextResponse.json({ ok: true, mode: 'replace', updated: true });
      }

      // If nothing updated, INSERT (handle unique race)
      try {
        await db.insert(productMatchOverrides).values({
          feTenantId,
          productSlug,
          companyIdentifier: normalizedCompany,
          catalogId: catalogIdValue,
          terms: cleaned,
        });
        return NextResponse.json({ ok: true, mode: 'replace', created: true });
      } catch (err: any) {
        if (err?.code === '23505') {
          await db
            .update(productMatchOverrides)
            .set({
              terms: cleaned,
              updatedAt: new Date(),
              ...(catalogIdValue != null ? { catalogId: catalogIdValue } : {}),
              companyIdentifier: normalizedCompany,
            })
            .where(whereClause);
          return NextResponse.json({ ok: true, mode: 'replace', updated: true });
        }
        throw err;
      }
    }

    // Default: APPEND
    const existing = await db.query.productMatchOverrides.findFirst({ where: whereClause });

    if (!existing) {
      try {
        await db.insert(productMatchOverrides).values({
          feTenantId,
          productSlug,
          companyIdentifier: normalizedCompany,
          catalogId: catalogIdValue,
          terms: cleaned,
        });
        return NextResponse.json({ ok: true, mode: 'append', created: true });
      } catch (err: any) {
        if (err?.code === '23505') {
          const afterRace = await db.query.productMatchOverrides.findFirst({ where: whereClause });
          const merged = Array.from(new Set([...(afterRace?.terms ?? []), ...cleaned]));
          await db
            .update(productMatchOverrides)
            .set({
              terms: merged,
              updatedAt: new Date(),
              ...(catalogIdValue != null ? { catalogId: catalogIdValue } : {}),
              companyIdentifier: normalizedCompany,
            })
            .where(whereClause);
          return NextResponse.json({ ok: true, mode: 'append', updated: true });
        }
        throw err;
      }
    }

    const merged = Array.from(new Set([...(existing.terms ?? []), ...cleaned]));
    await db
      .update(productMatchOverrides)
      .set({
        terms: merged,
        updatedAt: new Date(),
        ...(catalogIdValue != null ? { catalogId: catalogIdValue } : {}),
        companyIdentifier: normalizedCompany,
      })
      .where(whereClause);

    return NextResponse.json({ ok: true, mode: 'append', updated: true });
  } catch (e: any) {
    console.error('POST /api/matching/override failed:', e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: e?.status ?? 500 });
  }
}
