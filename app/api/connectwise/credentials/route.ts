import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { connectwiseCredentials } from '@/lib/db/schema';
import { encryptString } from '@/lib/crypto';
import { eq } from 'drizzle-orm';

function assertValidKey() {
  const k = process.env.DATA_ENCRYPTION_KEY_BASE64 || '';
  const buf = Buffer.from(k, 'base64');
  if (buf.length !== 32) {
    throw new Error('DATA_ENCRYPTION_KEY_BASE64 must be 32 random bytes (base64-encoded).');
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamIdStr = searchParams.get('teamId');
    const teamId = Number(teamIdStr);
    if (!teamIdStr || Number.isNaN(teamId)) {
      return new Response('Invalid teamId', { status: 400 });
    }

    const [row] = await db
      .select()
      .from(connectwiseCredentials)
      .where(eq(connectwiseCredentials.teamId, teamId))
      .limit(1);

    if (!row) return Response.json(null);
    return Response.json({ siteUrl: row.siteUrl, hasKeys: true });
  } catch (e: any) {
    console.error('GET /api/connectwise/credentials failed:', e);
    return new Response(e?.message || 'Internal error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertValidKey();

    const body = await req.json();
    const teamId = Number(body?.teamId);
    const siteUrl = String(body?.siteUrl || '');
    const companyId = String(body?.companyId || '');
    const publicKey = String(body?.publicKey || '');
    const privateKey = String(body?.privateKey || '');

    if (!teamId || Number.isNaN(teamId) || !siteUrl || !companyId || !publicKey || !privateKey) {
      return new Response('Missing/invalid fields', { status: 400 });
    }

    const now = new Date();
    const data = {
      teamId,
      siteUrl: siteUrl.replace(/\/$/, ''),
      companyIdEnc: encryptString(companyId),
      publicKeyEnc: encryptString(publicKey),
      privateKeyEnc: encryptString(privateKey),
      updatedAt: now,
    };

    const existing = await db
      .select({ id: connectwiseCredentials.id })
      .from(connectwiseCredentials)
      .where(eq(connectwiseCredentials.teamId, teamId))
      .limit(1);

    if (existing.length) {
      await db
        .update(connectwiseCredentials)
        .set(data)
        .where(eq(connectwiseCredentials.teamId, teamId));
    } else {
      await db.insert(connectwiseCredentials).values({ ...data, createdAt: now });
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    console.error('POST /api/connectwise/credentials failed:', e);
    return new Response(e?.message || 'Internal error', { status: 500 });
  }
}
