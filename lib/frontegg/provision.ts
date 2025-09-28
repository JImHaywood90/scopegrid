// lib/frontegg/provision.ts

import { getMgmtToken } from './fronteggMgmt';
import { getAdminRoleId } from './roles';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function provisionTenantAndUser(opts: {
  tenantName: string;
  externalId?: string;     // e.g. Stripe customer id
  userEmail?: string;
}) {
  const bearer = await getMgmtToken();

  // 1) Create tenant
  const tRes = await fetch('https://api.frontegg.com/tenants/resources/tenants/v1', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
    body: JSON.stringify({ name: opts.tenantName || 'New Customer', externalId: opts.externalId }),
  });
  if (!tRes.ok) throw new Error(`createTenant: ${tRes.status} ${await tRes.text()}`);
  const tJson = await tRes.json() as any;

  // normalize the id field
  const feTenantId: string | undefined = tJson.id || tJson.tenantId;
  if (!feTenantId) throw new Error(`createTenant: missing id in ${JSON.stringify(tJson)}`);

  // 2) Ensure tenant is readable (small race buffer)
  for (let i = 0; i < 3; i++) {
    const check = await fetch(
      `https://api.frontegg.com/tenants/resources/tenants/v1/${encodeURIComponent(feTenantId)}`,
      { headers: { authorization: `Bearer ${bearer}` } }
    );
    if (check.ok) break;
    await sleep(200 + 200 * i);
  }

  // 3) Create first user with Admin role (if we found one)
  if (opts.userEmail) {
    const adminRoleId = await getAdminRoleId(bearer); // may be null
    const payload: Record<string, any> = {
      email: opts.userEmail,
      name: opts.userEmail,
      tenantId: feTenantId,
      ...(adminRoleId ? { roleIds: [adminRoleId] } : {}),
      // optional flags you may want:
      // mfaBypass: true,
      // skipEmailVerification: true, // not supported on this endpoint; omit if not in your spec
    };

    // retry a couple times in case of eventual consistency
    let lastErr: any;
    for (let i = 0; i < 3; i++) {
      const uRes = await fetch('https://api.frontegg.com/identity/resources/vendor-only/users/v1', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify(payload),
      });
      if (uRes.ok) { lastErr = null; break; }
      lastErr = await uRes.text();
      await sleep(250 + 250 * i);
    }
    if (lastErr) console.warn('[provision] user create failed after retries:', lastErr);
  }

  return { feTenantId };
}
