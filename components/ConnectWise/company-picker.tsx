'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mutate as globalMutate } from 'swr';

type CwCompany = {
  id: number;
  name: string;
  identifier: string;
  status?: { name?: string };
};

function buildConditions(q: string) {
  const safe = q.replace(/"/g, '\\"');
  return `(name like "%${safe}%" or identifier like "%${safe}%") and status/name in ('Active','Special Info') and deletedFlag=false`;
}
function buildChildConditions() {
  return `types/name contains "customer" or types/name contains "client"`;
}

type Props = {
  onChanged?: (c: CwCompany) => void;
  className?: string;
  revalidateKeys?: string[]; // SWR keys to refresh on change
};

export default function CompanyPicker({
  onChanged,
  className,
  revalidateKeys = ['/api/dashboard/products'],
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState<CwCompany[]>([]);
  const [value, setValue] = React.useState<{ identifier: string; name: string } | null>(null);

  const sp = useSearchParams();
  const urlIdentifier =
    sp.get('CompanyIdentifier') ?? sp.get('companyIdentifier') ?? null;

  // Helper: persist cookie + notify + revalidate
  const persistAndNotify = React.useCallback(
    async (identifier: string, name: string) => {
      await fetch('/api/dashboard/company-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, name }),
      });
      window.dispatchEvent(new CustomEvent('sg:company-changed', { detail: { identifier } }));
      await Promise.all(revalidateKeys.map((k) => globalMutate(k)));
    },
    [revalidateKeys]
  );

  // 1) Initialize from URL param if present; otherwise from cookie
  React.useEffect(() => {
    (async () => {
      // If URL has an identifier and it's different, use it
      if (urlIdentifier && urlIdentifier !== value?.identifier) {
        let displayName = urlIdentifier;
        try {
          // Best-effort look-up to show a friendly name
          const res = await fetch(
            `/api/connectwise/company/companies?conditions=${encodeURIComponent(
              `identifier="${urlIdentifier}"`
            )}&pageSize=1`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            const [row] = (await res.json()) as CwCompany[];
            if (row?.name) displayName = row.name;
          }
        } catch {
          /* ignore */
        }
        setValue({ identifier: urlIdentifier, name: displayName });
        await persistAndNotify(urlIdentifier, displayName);
        return;
      }

      // Else load from cookie (if not already set)
      if (!value) {
        const r = await fetch('/api/dashboard/company-selection', { cache: 'no-store' });
        if (r.ok) {
          const { identifier, name } = await r.json();
          if (identifier) setValue({ identifier, name: name || identifier });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlIdentifier]); // react to URL changes

  // 2) Debounced search when popover is open
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
        const url =
          `/api/connectwise/company/companies` +
          `?conditions=${encodeURIComponent(buildConditions(q))}` +
          `&childConditions=${encodeURIComponent(buildChildConditions())}` +
          `&pageSize=25&orderBy=name%20asc`;
        const res = await fetch(url, { signal: ctl.signal });
        if (!res.ok) throw new Error(await res.text());
        const companies = (await res.json()) as CwCompany[];
        setOptions(companies);
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

  // 3) Handle manual pick
  async function pick(c: CwCompany) {
    setValue({ identifier: c.identifier, name: c.name });
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
            {value ? `${value.name} (${value.identifier})` : 'Pick a company…'}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={loading ? 'Searching…' : 'Search companies…'}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim().length < 2 ? 'Start typing…' : 'No companies found'}
            </CommandEmpty>
            <CommandGroup>
              {options.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.identifier}
                  onSelect={() => pick(c)}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.identifier} {c.status?.name ? `• ${c.status.name}` : ''}
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
