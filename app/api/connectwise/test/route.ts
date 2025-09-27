// app/api/connectwise/test/route.ts
import { NextResponse } from 'next/server';
import { cwHeadersAndBaseForCurrentUser } from '@/lib/connectwise';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const { baseUrl, headers } = await cwHeadersAndBaseForCurrentUser();

    // A lightweight endpoint to validate auth; adjust if needed
    const url = `${baseUrl}/system/info`;
    const r = await fetch(url, { headers });
    const txt = await r.text();

    if (!r.ok) {
      return new NextResponse(txt || 'ConnectWise responded with error', { status: r.status });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    const msg = e?.message || 'Test failed';
    const status = e?.status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
