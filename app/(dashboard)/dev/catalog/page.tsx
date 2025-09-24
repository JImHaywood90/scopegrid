'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { isDev } from '@/lib/dev';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Item = {
  id: number;
  slug: string;
  name: string;
  vendor: string | null;
  category: string | null;
  description: string | null;
  logoLightPath: string;
  tags: string[];
  matchTerms: string[];
  links: Record<string, string> | null;
};

type ItemForm = Partial<Omit<Item, 'tags' | 'matchTerms' | 'links'>> & {
  tags: string;        // UI: comma-separated
  matchTerms: string;  // UI: comma-separated
  links?: string;      // UI: JSON string
};

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function toArray(s: string | undefined) {
  return (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function tryParseJson(s?: string) {
  if (!s || !s.trim()) return null;
  try {
    const obj = JSON.parse(s);
    if (obj && typeof obj === 'object') return obj as Record<string, string>;
  } catch {
    // keep as null if invalid
  }
  return null;
}

export default function DevCatalogPage() {
  // Hide page content in production (APIs are also guarded)
  if (!isDev) return null;

  const { data, mutate } = useSWR<Item[]>('/api/dev/catalog', fetcher);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ItemForm>({ tags: '', matchTerms: '' });
  const [saving, setSaving] = useState(false);

  const onEdit = (it: Item) => {
    setEditingId(it.id);
    setForm({
      id: it.id,
      slug: it.slug,
      name: it.name,
      vendor: it.vendor ?? undefined,
      category: it.category ?? undefined,
      description: it.description ?? undefined,
      logoLightPath: it.logoLightPath,
      tags: it.tags?.join(', ') ?? '',
      matchTerms: it.matchTerms?.join(', ') ?? '',
      links: it.links ? JSON.stringify(it.links, null, 2) : '',
    });
  };

  const onReset = () => {
    setEditingId(null);
    setForm({ tags: '', matchTerms: '' });
  };

  async function save() {
    setSaving(true);
    try {
      const payload = {
        slug: form.slug?.trim(),
        name: form.name?.trim(),
        vendor: form.vendor?.trim() || null,
        category: form.category?.trim() || null,
        description: form.description?.trim() || null,
        logoLightPath: form.logoLightPath?.trim(),
        tags: toArray(form.tags),
        matchTerms: toArray(form.matchTerms),
        links: tryParseJson(form.links),
      };

      if (!payload.slug || !payload.name || !payload.logoLightPath) {
        alert('slug, name, and logoLightPath are required.');
        return;
        }

      const url = editingId ? `/api/dev/catalog/${editingId}` : '/api/dev/catalog';
      const method = editingId ? 'PUT' : 'POST';

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const msg = await r.text().catch(() => 'Save failed');
        alert(msg || 'Save failed');
        return;
      }

      await mutate();
      onReset();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this product?')) return;
    const r = await fetch(`/api/dev/catalog/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      alert(await r.text());
    } else {
      mutate();
      if (editingId === id) onReset();
    }
  }

  return (
    <section className="p-4 lg:p-8 space-y-8">
      <h1 className="text-2xl font-semibold">Dev: Product Catalog</h1>

      {/* Create / Edit */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit product' : 'Add product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug || ''}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="veeam"
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name || ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Veeam"
              />
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={form.vendor || ''}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="Veeam"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category || ''}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Backup"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="logo">Logo path (public)</Label>
              <Input
                id="logo"
                value={form.logoLightPath || ''}
                onChange={(e) => setForm((f) => ({ ...f, logoLightPath: e.target.value }))}
                placeholder="/logos/veeam250.png"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                className="w-full border rounded-md p-2 text-sm"
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description for this product…"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="backup, bcdr"
              />
            </div>

            <div>
              <Label htmlFor="terms">Match terms (comma-separated)</Label>
              <Input
                id="terms"
                value={form.matchTerms}
                onChange={(e) => setForm((f) => ({ ...f, matchTerms: e.target.value }))}
                placeholder="veeam, vbr, backup"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="links">Links (JSON object, optional)</Label>
              <textarea
                id="links"
                rows={4}
                className="w-full border rounded-md p-2 font-mono text-sm"
                value={form.links || ''}
                onChange={(e) => setForm((f) => ({ ...f, links: e.target.value }))}
                placeholder={`{ "site": "https://example.com", "docs": "https://docs.example.com" }`}
              />
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <Button
                onClick={save}
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </Button>
              {editingId ? (
                <Button variant="outline" onClick={onReset}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Catalog ({data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!data?.length ? (
            <div className="text-sm text-muted-foreground">No products yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.map((it) => (
                <div key={it.id} className="border rounded-lg p-3">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.slug}</div>
                  <div className="text-xs">{it.vendor || '—'} • {it.category || '—'}</div>
                  <div className="text-xs break-all mt-1">{it.logoLightPath}</div>
                  <div className="text-xs mt-1 line-clamp-2">{it.description || '—'}</div>
                  <div className="text-xs mt-1">
                    <b>tags:</b> {it.tags?.join(', ') || '—'}
                  </div>
                  <div className="text-xs">
                    <b>terms:</b> {it.matchTerms?.join(', ') || '—'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(it)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(it.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
