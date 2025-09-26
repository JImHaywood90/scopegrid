"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { bySlug } from "@/components/integrations/registry";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function IntegrationForm({ slug }: { slug: string }) {
  const meta = bySlug[slug];

  // SWR for existing config
  const { data, isLoading, mutate } = useSWR<{
    item: { config?: Record<string, any>; connected?: boolean } | null;
  }>(`/api/integrations/${slug}`, fetcher);

  // Build a deterministic empty form shape from meta
  const emptyForm = useMemo(() => {
    const base: Record<string, string> = {};
    meta.fields.forEach((f) => (base[f.name] = ""));
    return base;
  }, [meta]);

  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [connected, setConnected] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  // Sync local state when SWR data arrives
  useEffect(() => {
    const cfg = (data?.item?.config as Record<string, any>) ?? {};
    const nextForm: Record<string, string> = { ...emptyForm };
    meta.fields.forEach((f) => {
      nextForm[f.name] =
        typeof cfg[f.name] === "string" ? (cfg[f.name] as string) : "";
    });
    setForm(nextForm);
    setConnected(!!data?.item?.connected);
  }, [data, emptyForm, meta.fields]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/integrations/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ config: form, connected }),
    });
    setSaving(false);
    if (res.ok) {
      // revalidate list/detail
      mutate();
    }
  }

  function handleText(name: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = (e.target as HTMLInputElement | null)?.value ?? "";
      setForm((s) => ({ ...s, [name]: v }));
    };
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Image
          src={meta.logoLight}
          alt={meta.name}
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
        <h1 className="text-lg lg:text-2xl font-medium">{meta.name}</h1>
      </div>

      <Card className="p-4 rounded-2xl bg-white/85 dark:bg-slate-900/65 backdrop-blur">
        <form onSubmit={onSubmit} className="space-y-4">
          {meta.fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input
                id={f.name}
                type={
                  f.type === "password"
                    ? "password"
                    : f.type === "url"
                    ? "url"
                    : "text"
                }
                placeholder={f.placeholder}
                required={!!f.required}
                value={form[f.name] ?? ""}
                onChange={handleText(f.name)}
              />
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <input
              id="connected"
              type="checkbox"
              className="h-4 w-4"
              checked={connected}
              onChange={(e) => setConnected(e.currentTarget.checked)}
            />
            <Label htmlFor="connected">Mark as connected</Label>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={saving || isLoading}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
