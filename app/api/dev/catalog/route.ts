import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productCatalog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { assertDev } from '@/lib/dev';

export const runtime = 'nodejs';

export async function GET() {
  assertDev();
  const items = await db.select().from(productCatalog).orderBy(productCatalog.name);
  return Response.json(items);
}

export async function POST(req: NextRequest) {
  assertDev();
  const body = await req.json();
  const {
    slug, name, vendor = null, category = null, description = null,
    logoLightPath, logoDarkPath, tags = [], matchTerms = [], links = null,
  } = body || {};

  if (!slug || !name || !logoLightPath) {
    return new Response('slug, name, logoLightPath required', { status: 400 });
  }

  const exists = await db.query.productCatalog.findFirst({
    where: eq(productCatalog.slug, slug),
    columns: { id: true },
  });
  if (exists) {
    return new Response('Slug already exists', { status: 409 });
  }

  const [created] = await db.insert(productCatalog).values({
    slug, name, vendor, category, description,
    logoLightPath, logoDarkPath, tags, matchTerms, links,
  }).returning();

  return Response.json(created);
}
