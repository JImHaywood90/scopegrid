import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productCatalog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { assertDev } from '@/lib/dev';

type Params = { params: Promise<{ id: string }> };

export const runtime = 'nodejs';

export async function PUT(req: NextRequest, ctx: Params) {
  assertDev();
  const { id } = await ctx.params;
  const body = await req.json();

  const [updated] = await db
    .update(productCatalog)
    .set({
      slug: body.slug,
      name: body.name,
      vendor: body.vendor ?? null,
      category: body.category ?? null,
      description: body.description ?? null,
      logoLightPath: body.logoLightPath,
      tags: Array.isArray(body.tags) ? body.tags : [],
      matchTerms: Array.isArray(body.matchTerms) ? body.matchTerms : [],
      links: body.links ?? null,
      updatedAt: new Date(),
    })
    .where(eq(productCatalog.id, Number(id)))
    .returning();

  if (!updated) return new Response('Not found', { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Params) {
  assertDev();
  const { id } = await ctx.params;
  await db.delete(productCatalog).where(eq(productCatalog.id, Number(id)));
  return new Response(null, { status: 204 });
}
