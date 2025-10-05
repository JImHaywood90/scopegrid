export interface MatchInput<TProduct, TCatalogItem> {
  products: TProduct[];
  catalog: TCatalogItem[];
  overrides?: Record<string, string>; // productId -> catalogId
  exclusions?: Set<string>; // productId excluded
  slugToId?: Record<string, string | number>; // optional: catalogSlug -> catalogId
}

export interface MatchResult<TProduct, TCatalogItem> {
  matched: Array<{ product: TProduct; catalog: TCatalogItem; reason?: string }>;
  unmatched: TProduct[];
}

// Basic matching: by normalized name, then apply overrides and exclusions.
export function computeMatches<
  TProduct extends { id?: string | number; name?: string; terms?: string[] },
  TCatalogItem extends { id?: string | number; name?: string; slug?: string; matchTerms?: string[] }
>(
  input: MatchInput<TProduct, TCatalogItem>
): MatchResult<TProduct, TCatalogItem> {
  const { products, catalog, overrides = {}, exclusions = new Set<string>(), slugToId } = input;

  const byId = new Map<any, TCatalogItem>();
  const byName = new Map<string, TCatalogItem>();
  const byTerm = new Map<string, TCatalogItem>();
  const catalogTokens = new Map<TCatalogItem, Set<string>>();
  for (const c of catalog) {
    if (c.id != null) byId.set(c.id, c);
    if (c.name) byName.set(normalize(c.name), c);
    const terms = (c as any).matchTerms as string[] | undefined;
    if (Array.isArray(terms)) {
      for (const t of terms) {
        const nt = normalize(t);
        if (nt) byTerm.set(nt, c);
      }
    }
    if ((c as any).slug) {
      const ns = normalize(String((c as any).slug));
      if (ns) byTerm.set(ns, c);
    }
    // Fallback: also index catalog name as a term to improve recall
    if ((c as any).name) {
      const nn = normalize(String((c as any).name));
      if (nn) byTerm.set(nn, c);
      const toks = new Set<string>();
      for (const t of nn.split(/[^a-z0-9]+/)) {
        if (t && t.length >= 2) toks.add(t);
      }
      catalogTokens.set(c, toks);
    }
  }

  const matched: Array<{ product: TProduct; catalog: TCatalogItem; reason?: string }> = [];
  const unmatched: TProduct[] = [];

  for (const p of products) {
    const pid = p.id?.toString();
    if (pid && exclusions.has(pid)) {
      continue; // excluded
    }

    // explicit override
    if (pid && overrides[pid] != null) {
      const ov = overrides[pid];
      const resolvedId = slugToId?.[ov] ?? ov; // prefer slug->id mapping when provided
      const target = byId.get(resolvedId);
      if (target) {
        matched.push({ product: p, catalog: target, reason: 'override' });
        continue;
      }
    }

    // name/slug match
    if (p.name) {
      const n = normalize(p.name);
      const target = byName.get(n) || byTerm.get(n);
      if (target) {
        matched.push({ product: p, catalog: target, reason: 'name' });
        continue;
      }
    }

    // terms match (sku, mpn, extra identifiers)
    if (Array.isArray(p.terms) && p.terms.length) {
      let hit: TCatalogItem | undefined;
      // exact normalized term hits
      for (const t of p.terms) {
        const nt = normalize(String(t));
        if (!nt) continue;
        const found = byTerm.get(nt) || byName.get(nt);
        if (found) { hit = found; break; }
      }
      // token inclusion fallback (handles short model codes)
      if (!hit) {
        for (const t of p.terms) {
          const nt = normalize(String(t));
          if (!nt) continue;
          const ptoks = nt.split(/[^a-z0-9]+/).filter((x) => x && x.length >= 2);
          if (!ptoks.length) continue;
          for (const [cat, toks] of catalogTokens.entries()) {
            for (const tk of ptoks) {
              if (toks.has(tk)) { hit = cat; break; }
            }
            if (hit) break;
          }
          if (hit) break;
        }
      }
      if (hit) {
        matched.push({ product: p, catalog: hit, reason: 'term' });
        continue;
      }
    }

    unmatched.push(p);
  }

  return { matched, unmatched };
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-') // normalize dashes
    .replace(/[()\[\]{}]/g, ' ') // drop brackets
    .replace(/[^a-z0-9\s.-]/g, '') // strip punctuation except dot and dash
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}
