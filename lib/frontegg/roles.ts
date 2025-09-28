// lib/frontegg/roles.ts
let cachedAdminRoleId: string | null = null;

export async function getAdminRoleId(bearer: string): Promise<string | null> {
  if (cachedAdminRoleId) return cachedAdminRoleId;

  const res = await fetch('https://api.frontegg.com/identity/resources/roles/v1', {
    headers: { authorization: `Bearer ${bearer}` },
  });
  if (!res.ok) {
    console.warn('[frontegg] failed to list roles:', await res.text());
    return null;
  }
  const roles = (await res.json()) as Array<{ id: string; key?: string; name?: string }>;

  // prefer role.key === 'admin'; then name contains 'admin'; otherwise first role
  const byKey   = roles.find(r => r.key?.toLowerCase() === 'admin');
  const byName  = roles.find(r => (r.name || '').toLowerCase().includes('admin'));
  const picked  = byKey || byName || roles[0];
  cachedAdminRoleId = picked?.id ?? null;
  return cachedAdminRoleId;
}