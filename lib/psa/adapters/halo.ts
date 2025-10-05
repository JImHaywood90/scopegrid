import type { PsaAdapter, PsaAdapterContext, PsaAdapterResult, PsaSignal } from '../types';

export const haloAdapter: PsaAdapter = {
  kind: 'halo',
  async fetchCompanyEntities(ctx: PsaAdapterContext): Promise<PsaAdapterResult> {
    const { origin, cookie, companyIdentifier } = ctx;
    const clientIdRaw = companyIdentifier;
    const clientIdNum = Number(clientIdRaw);
    const clientId = Number.isFinite(clientIdNum) ? clientIdNum : clientIdRaw;

    async function pull(url: string) {
      try {
        const r = await fetch(url, { headers: { cookie }, cache: 'no-store' });
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    }

    function listFrom(payload: any, ...keys: string[]) {
      if (Array.isArray(payload)) return payload;
      for (const k of keys) if (Array.isArray(payload?.[k])) return payload[k];
      const firstArray = Object.values(payload || {}).find(Array.isArray);
      return Array.isArray(firstArray) ? firstArray : [];
    }

    function filterToClient(rows: any[]): any[] {
      return (rows || []).filter((row) => {
        const cid = row?.client_id ?? row?.clientId ?? row?.customer_id ?? row?.organisation_id ?? row?.client?.id ?? row?.customer?.id ?? row?.organisation?.id;
        if (cid == null) return false;
        return String(cid) === String(clientId);
      });
    }

    const results: any[] = [];
    {
      const data = await pull(`${origin}/api/halo/RecurringInvoiceContract?client_id=${encodeURIComponent(String(clientId))}&pageSize=1000`);
      results.push(...filterToClient(listFrom(data, 'contracts', 'recurringinvoicecontracts')));
    }
    {
      const data = await pull(`${origin}/api/halo/Contract?client_id=${encodeURIComponent(String(clientId))}&pageSize=1000`);
      results.push(...filterToClient(listFrom(data, 'contracts')));
    }
    {
      const data = await pull(`${origin}/api/halo/Asset?client_id=${encodeURIComponent(String(clientId))}&pageSize=1000`);
      results.push(...filterToClient(listFrom(data, 'assets')));
    }

    return { entities: results, meta: { total: results.length } };
  },
  extractSignals(result: PsaAdapterResult): PsaSignal[] {
    const entities = result.entities || [];
    const out: PsaSignal[] = [];
    const pushTerm = (arr: string[], v?: any) => { if (typeof v === 'string' && v.trim()) arr.push(v.toLowerCase()); };
    for (const e of entities) {
      const terms: string[] = [];
      pushTerm(terms, e?.name ?? e?.item_name ?? e?.product_name);
      pushTerm(terms, e?.client_name);
      pushTerm(terms, e?.item_code ?? e?.product_code);
      pushTerm(terms, e?.sku);
      pushTerm(terms, e?.manufacturer_part_number ?? e?.mpn);
      pushTerm(terms, e?.vendor_sku);
      pushTerm(terms, e?.model);
      pushTerm(terms, e?.type);
      pushTerm(terms, e?.category);
      pushTerm(terms, e?.subcategory);
      const id = e?.id ?? e?.reference ?? terms[0] ?? Math.random();
      const name = e?.name ?? e?.item_name ?? e?.product_name ?? String(id);
      out.push({ id, name, terms: Array.from(new Set(terms)), kind: 'halo', meta: {} });
    }
    return out;
  },
};
