// app/api/bootstrap/route.ts
import { NextResponse } from 'next/server';
import { bootstrapFromFrontegg } from '@/lib/auth/bootstrap';

export const runtime = 'nodejs';
export async function POST() {
  try {
    const res = await bootstrapFromFrontegg();
    return NextResponse.json({ ok: true, ...res });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'bootstrap failed' }, { status: e?.status ?? 500 });
  }
}
