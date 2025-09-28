'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { mutate as globalMutate } from 'swr';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type UnifiedCompany = {
  identifier: string; // PSA-agnostic identifier (CW: identifier; Halo: ref/id as string)
  name: string;       // Display name
  subtitle?: string;  // Optional extra line
};

type Props = {
  onChanged?: (c: { identifier: string; name: string }) => void;
  className?: string;
  /** SWR keys to revalidate after a selection */
  revalidateKeys?: string[];
};

export default function CompanyPicker({
  onChanged,
  className,
  revalidateKeys = ['/api/dashboard/products'],
}: Props) {
  const sp = useSearchParams();
  const urlIdentifier =
    sp?.get('CompanyIdentifier') ?? sp?.get('companyIdentifier') ?? null;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState<UnifiedCompany[]>([]);
  const [value, setValue] = React.useState<UnifiedCompany | null>(null);

  const persistAndNotify = React.useCallback(
    async (identifier: string, name: string) => {
      await fetch('/api/dashboard/company-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, name }),
      });
      window.dispatchEvent(
        new CustomEvent('sg:company-changed', { detail: { identifier } })
      );
      await Promise.all(revalidateKeys.map((k) => globalMutate(k)));
    },
    [revalidateKeys]
  );

  // 1) Initialize from URL param first; otherwise from cookie
  React.useEffect(() => {
    (async () => {
      // URL param takes precedence
      if (urlIdentifier && urlIdentifier !== value?.identifier) {
        try {
          const r = await fetch(
            `/api/psa/client/resolve?identifier=${encodeURIComponent(urlIdentifier)}`,
            { cache: 'no-store' }
          );
          const j = await r.json();
          const uni = {
            identifier: urlIdentifier,
            name: j?.name || urlIdentifier,
          };
          setValue(uni);
          await persistAndNotify(uni.identifier, uni.name);
          return;
        } catch {
          const uni = { identifier: urlIdentifier, name: urlIdentifier };
          setValue(uni);
          await persistAndNotify(uni.identifier, uni.name);
          return;
        }
      }

      // Otherwise load from cookie (if not already set)
      if (!value) {
        const r = await fetch('/api/dashboard/company-selection', { cache: 'no-store' });
        if (r.ok) {
          const { identifier, name } = await r.json();
          if (identifier) {
            setValue({ identifier, name: name || identifier });
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlIdentifier]);

  // 2) Debounced search via unified PSA endpoint
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
        const items: UnifiedCompany[] = (Array.isArray(j?.items) ? j.items : []).map(
          (x: any) => ({
            identifier: String(x.identifier),
            name: String(x.name),
            subtitle: x.statusName ? `Status: ${x.statusName}` : undefined,
          })
        );
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

  // 3) Pick handler
  async function pick(c: UnifiedCompany) {
    setValue(c);
    setOpen(false);
    await persistAndNotify(c.identifier, c.name);
    onChanged?.(c);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[320px] justify-between', className)}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 opacity-70" />
            {value ? `${value.name} (${value.identifier})` : 'Pick a customer…'}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={loading ? 'Searching…' : 'Search customers…'}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim().length < 2 ? 'Start typing…' : 'No results'}
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
                      {c.subtitle ? ` • ${c.subtitle}` : ''}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      'h-4 w-4',
                      value?.identifier === c.identifier ? 'opacity-100' : 'opacity-0'
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
