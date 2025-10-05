"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { mutate as globalMutate } from "swr";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyContext } from "@/contexts/CompanyContext";

type UnifiedCompany = {
  identifier: string;
  name: string;
  subtitle?: string;
};

type Props = {
  onChanged?: (c: { identifier: string; name: string }) => void;
  className?: string;
  revalidateKeys?: string[];
};

export default function CompanyPicker({
  onChanged,
  className,
  revalidateKeys = ["/api/dashboard/products"],
}: Props) {
  const sp = useSearchParams();
  const urlIdentifier =
    sp?.get("CompanyIdentifier") ?? sp?.get("companyIdentifier") ?? null;

  const { identifier, name, setCompanyContext } = useCompanyContext();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState<UnifiedCompany[]>([]);
  const [value, setValue] = React.useState<UnifiedCompany | null>(null);

  // Helper to set context + notify + trigger revalidation
  const persistAndNotify = React.useCallback(
    async (identifier: string, name: string) => {
      setCompanyContext({ identifier, name });
      setValue({ identifier, name });
      window.dispatchEvent(
        new CustomEvent("sg:company-changed", { detail: { identifier } })
      );
      await Promise.all(
        revalidateKeys.map((key) =>
          globalMutate(
            key,
            () =>
              fetch(key, {
                headers: {
                  "x-company-identifier": identifier,
                },
              }).then((res) => res.json()),
            false // avoid revalidating in background again
          )
        )
      );
    },
    [revalidateKeys, setCompanyContext]
  );

  // Load from URL param if present
  React.useEffect(() => {
    (async () => {
      if (!urlIdentifier || identifier === urlIdentifier) return;

      try {
        const r = await fetch(
          `/api/psa/client/resolve?identifier=${encodeURIComponent(
            urlIdentifier
          )}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        const resolvedName = j?.name || urlIdentifier;
        await persistAndNotify(urlIdentifier, resolvedName);
      } catch {
        await persistAndNotify(urlIdentifier, urlIdentifier);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlIdentifier]);

  // Debounced search logic
  React.useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (q.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/psa/clients?q=${encodeURIComponent(q)}&pageSize=25`,
          { signal: ctl.signal }
        );
        if (!res.ok) throw new Error(await res.text());

        const j = await res.json();
        const items: UnifiedCompany[] = (
          Array.isArray(j?.items) ? j.items : []
        ).map((x: any) => ({
          identifier: String(x.identifier),
          name: String(x.name),
          subtitle: x.statusName ? `Status: ${x.statusName}` : undefined,
        }));
        setOptions(items);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [open, query]);

  async function pick(c: UnifiedCompany) {
    await persistAndNotify(c.identifier, c.name);
    setOpen(false);
    onChanged?.(c);
  }

  React.useEffect(() => {
    if (!identifier || !name) return;
    setValue({ identifier, name });
  }, [identifier, name]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[320px] justify-between", className)}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 opacity-70" />
            {name && identifier
              ? `${name} (${identifier})`
              : "Pick a customer…"}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={loading ? "Searching…" : "Search customers…"}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim().length < 2 ? "Start typing…" : "No results"}
            </CommandEmpty>
            <CommandGroup>
              {options.map((c) => (
                <CommandItem
                  key={c.identifier}
                  value={c.identifier}
                  onSelect={() => pick(c)}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.identifier}
                      {c.subtitle ? ` • ${c.subtitle}` : ""}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      identifier === c.identifier ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
