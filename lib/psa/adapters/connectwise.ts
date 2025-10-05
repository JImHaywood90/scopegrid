import type { PsaAdapter, PsaAdapterContext, PsaAdapterResult, PsaSignal } from '../types';

const KIND_ADDITION = 'addition';
const KIND_CONFIGURATION = 'configuration';

export const connectwiseAdapter: PsaAdapter = {
  kind: 'connectwise',
  async fetchCompanyEntities(ctx: PsaAdapterContext): Promise<PsaAdapterResult> {
    const { origin, cookie, companyIdentifier } = ctx;
    const CHUNK = 50;
    const entities: any[] = [];

    const firstBundle = [
      {
        Version: '2020.1',
        SequenceNumber: 1,
        ResourceType: 'agreement',
        ApiRequest: {
          filters: {
            conditions: `company/identifier="${companyIdentifier}" and agreementStatus="Active" and cancelledFlag=false`,
          },
          page: { page: 1, pageSize: 1000 },
        },
      },
      {
        Version: '2020.1',
        SequenceNumber: 2,
        ResourceType: 'configuration',
        ApiRequest: {
          filters: {
            conditions: `company/identifier="${companyIdentifier}" and status/name="Active"`,
          },
          page: { page: 1, pageSize: 1000 },
        },
      },
    ];

    const firstRes = await fetch(`${origin}/api/connectwise/system/bundles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: JSON.stringify({ requests: firstBundle }),
      cache: 'no-store',
    });
    if (!firstRes.ok) return { entities: [], meta: { agreements: 0, additions: 0, configurations: 0 } };
    const firstJson = await firstRes.json();
    const agreements = (firstJson.results.find((r: any) => r.sequenceNumber === 1)?.entities ?? []) as Array<{ id: number; name?: string }>;
    const configurations = (firstJson.results.find((r: any) => r.sequenceNumber === 2)?.entities ?? []) as any[];

    const agreementsMap = new Map<number, string>();
    for (const ag of agreements) {
      if (ag?.id != null) agreementsMap.set(ag.id, ag?.name ?? '');
    }

    const configurationEntities = configurations.map((cfg) => ({
      ...cfg,
      __psaKind: KIND_CONFIGURATION,
    }));
    entities.push(...configurationEntities);

    const agreementIds = agreements.map((a) => a?.id).filter((n): n is number => Number.isFinite(n));
    const additionEntities: any[] = [];
    if (agreementIds.length) {
      const addReqs = agreementIds.map((id) => ({
        Version: '2020.1',
        SequenceNumber: id,
        ResourceType: 'addition',
        ApiRequest: { parentId: id, filters: { conditions: 'cancelledDate=null' }, page: { page: 1, pageSize: 1000 } },
      }));
      for (let i = 0; i < addReqs.length; i += CHUNK) {
        const chunk = addReqs.slice(i, i + CHUNK);
        const r = await fetch(`${origin}/api/connectwise/system/bundles`, {
          method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
          body: JSON.stringify({ requests: chunk }), cache: 'no-store',
        });
        if (!r.ok) continue;
        const j = await r.json();
        for (const res of j.results || []) {
          const arr = Array.isArray(res.entities) ? res.entities : res.data ? [res.data] : [];
          for (const add of arr) {
            additionEntities.push({
              ...add,
              __psaKind: KIND_ADDITION,
              __psaAgreementName: agreementsMap.get(add?.agreementId ?? -1) ?? undefined,
            });
          }
        }
      }
    }

    entities.push(...additionEntities);

    return {
      entities,
      meta: {
        agreements: agreements.length,
        additions: additionEntities.length,
        configurations: configurationEntities.length,
      },
    };
  },
  extractSignals(result: PsaAdapterResult): PsaSignal[] {
    const entities = result.entities || [];
    const out: PsaSignal[] = [];
    const pushTerm = (arr: string[], v?: any) => { if (typeof v === 'string' && v.trim()) arr.push(v.toLowerCase()); };
    for (const e of entities) {
      const terms: string[] = [];
      const kind = e?.__psaKind as string | undefined;
      const meta: Record<string, unknown> = {};

      if (kind === KIND_CONFIGURATION) {
        pushTerm(terms, e?.name);
        pushTerm(terms, e?.type?.name);
        pushTerm(terms, e?.manufacturer?.name);
        pushTerm(terms, e?.vendor?.name);
        // additional helpful identifiers
        pushTerm(terms, e?.modelNumber);
        pushTerm(terms, e?.deviceIdentifier);
        pushTerm(terms, e?.manufacturerPartNumber);
        meta.typeName = e?.type?.name ?? null;
        meta.vendorName = e?.vendor?.name ?? null;
        meta.manufacturerName = e?.manufacturer?.name ?? null;
        meta.modelNumber = e?.modelNumber ?? null;
      }
      if (kind === KIND_ADDITION) {
        pushTerm(terms, e?.product?.identifier ?? e?.catalogItem?.identifier);
        pushTerm(terms, e?.invoiceDescription);
        pushTerm(terms, e?.description);
        // sometimes product name contains brand/model
        pushTerm(terms, e?.product?.name ?? e?.catalogItem?.name);
        pushTerm(terms, e?.integrationXRef);
        meta.productIdentifier = e?.product?.identifier ?? e?.catalogItem?.identifier ?? null;
        meta.description = e?.description ?? null;
        meta.invoiceDescription = e?.invoiceDescription ?? null;
        meta.vendorSku = e?.vendorSku ?? null;
        meta.manufacturerPartNumber = e?.manufacturerPartNumber ?? null;
        meta.agreementId = e?.agreementId ?? null;
        meta.agreementName = e?.__psaAgreementName ?? null;
      }
      // Generic extras that also help
      pushTerm(terms, e?.item?.identifier);
      pushTerm(terms, e?.item?.name);
      pushTerm(terms, e?.sku);
      pushTerm(terms, e?.manufacturerPartNumber);
      pushTerm(terms, e?.vendorSku);
      const id = e?.id ?? e?.identifier ?? terms[0] ?? Math.random();
      const name = e?.name ?? e?.type?.name ?? e?.product?.name ?? e?.catalogItem?.name ?? String(id);
      out.push({ id, name, terms: Array.from(new Set(terms)), kind, meta });
    }
    return out;
  },
};
