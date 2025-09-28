import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Normalize CW/Halo responses to: { items: {identifier,name,subtitle?}[] }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const pageSize = Number(searchParams.get('pageSize') || 25);

    if (q.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const origin = req.nextUrl.origin;
    const cookie = req.headers.get('cookie') || '';

    // Ask which PSA this tenant uses (your existing endpoint)
    const infoRes = await fetch(`${origin}/api/psa/info`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!infoRes.ok) {
      const txt = await infoRes.text().catch(() => '');
      return NextResponse.json({ items: [], error: `psa/info failed: ${txt}` }, { status: 500 });
    }
    const info = await infoRes.json() as { kind: 'connectwise' | 'halo' };

    if (info.kind === 'connectwise') {
      // CW: /company/companies with conditions + childConditions
      const safe = q.replace(/"/g, '\\"');
      const conditions = `(name like "%${safe}%" or identifier like "%${safe}%") and status/name in ('Active','Special Info') and deletedFlag=false`;
      const childConditions = `types/name contains "customer" or types/name contains "client"`;

      const url =
        `${origin}/api/connectwise/company/companies` +
        `?conditions=${encodeURIComponent(conditions)}` +
        `&childConditions=${encodeURIComponent(childConditions)}` +
        `&pageSize=${pageSize}&orderBy=name%20asc`;

      const cwRes = await fetch(url, { headers: { cookie }, cache: 'no-store' });
      if (!cwRes.ok) {
        const txt = await cwRes.text().catch(() => '');
        return NextResponse.json({ items: [], error: txt }, { status: cwRes.status });
      }
      const rows = await cwRes.json();

      const items = (Array.isArray(rows) ? rows : []).map((r: any) => ({
        identifier: String(r?.identifier ?? ''),
        name: String(r?.name ?? r?.identifier ?? 'Unknown'),
        subtitle: r?.status?.name ? `Status: ${r.status.name}` : undefined,
      })).filter((x: any) => x.identifier);

      return NextResponse.json({ items });
    }

    // HALO: /Client?search=&pageSize=
    const haloUrl =
      `${origin}/api/halo/Client?search=${encodeURIComponent(q)}&pageSize=${pageSize}`;

    const haloRes = await fetch(haloUrl, { headers: { cookie }, cache: 'no-store' });
    if (!haloRes.ok) {
      const txt = await haloRes.text().catch(() => '');
      return NextResponse.json({ items: [], error: txt }, { status: haloRes.status });
    }
    const j = await haloRes.json();

    const list = Array.isArray(j) ? j
      : Array.isArray(j?.clients) ? j.clients
      : [];

    const items = list.map((r: any) => {
      // Prefer a friendly identifier if available
      const id = r?.ref ?? r?.reference ?? r?.id ?? r?.client_id ?? r?.clientId;
      const nm = r?.name ?? r?.client_name ?? r?.display_name ?? r?.reference ?? `Client #${id}`;
      const ref = r?.ref ?? r?.reference;
      return {
        identifier: String(id ?? ''),
        name: String(nm ?? ''),
        subtitle: ref ? `Ref: ${ref}` : undefined,
      };
    }).filter((x: any) => x.identifier && x.name);

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: String(e?.message || e) }, { status: 500 });
  }
}
