// app/api/_whoami/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@frontegg/nextjs/app';

export async function GET() {
  const s = await getAppSession();
  return NextResponse.json({ session: s ?? null });
}
