import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Given ?identifier=..., return { name } for display.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const identifier = (searchParams.get('identifier') || '').trim();
    if (!identifier) return NextResponse.json({});

    const origin = req.nextUrl.origin;
    const cookie = req.headers.get('cookie') || '';

    // Which PSA?
    const infoRes = await fetch(`${origin}/api/psa/info`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!infoRes.ok) {
      const txt = await infoRes.text().catch(() => '');
      return NextResponse.json({ error: `psa/info failed: ${txt}` }, { status: 500 });
    }
    const info = await infoRes.json() as { kind: 'connectwise' | 'halo' };

    if (info.kind === 'connectwise') {
      const url =
        `${origin}/api/connectwise/company/companies?` +
        `conditions=${encodeURIComponent(`identifier="${identifier}"`)}&pageSize=1`;

      const r = await fetch(url, { headers: { cookie }, cache: 'no-store' });
      if (!r.ok) return NextResponse.json({});
      const [row] = await r.json();
      return NextResponse.json({ name: row?.name || identifier });
    }

    // HALO: try direct by id if supported, otherwise search and match
    // direct
    let haloName: string | undefined;
    const direct = await fetch(`${origin}/api/halo/Client/${encodeURIComponent(identifier)}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (direct.ok) {
      const row = await direct.json();
      haloName = row?.name ?? row?.client_name ?? row?.display_name ?? row?.reference;
      if (haloName) return NextResponse.json({ name: haloName });
    }

    // fallback: search and pick the one with matching id/reference
    const search = await fetch(
      `${origin}/api/halo/Client?search=${encodeURIComponent(identifier)}&pageSize=25`,
      { headers: { cookie }, cache: 'no-store' }
    );
    if (search.ok) {
      const j = await search.json();
      const list = Array.isArray(j) ? j : Array.isArray(j?.clients) ? j.clients : [];
      const hit = list.find((r: any) =>
        String(r?.id ?? r?.client_id ?? r?.clientId) === identifier ||
        String(r?.ref ?? r?.reference ?? r?.id) === identifier
      );
      if (hit) {
        const nm =
          hit?.name ?? hit?.client_name ?? hit?.display_name ?? hit?.reference ?? identifier;
        return NextResponse.json({ name: nm });
      }
    }

    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}
