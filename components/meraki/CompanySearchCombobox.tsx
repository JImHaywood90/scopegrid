"use client";

import * as React from "react";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type CompanyOption = {
  identifier: string;
  name: string;
  subtitle?: string;
};

type Props = {
  value?: CompanyOption | null;
  onSelect(option: CompanyOption): void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const MIN_QUERY = 2;

export function CompanySearchCombobox({
  value,
  onSelect,
  placeholder = "Search companies…",
  disabled = false,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<CompanyOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const needle = query.trim();
    if (needle.length < MIN_QUERY) {
      setOptions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/psa/clients?q=${encodeURIComponent(needle)}&pageSize=25`,
          { signal: ctl.signal }
        );
        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {}

        if (!res.ok) {
          throw new Error(json?.error || text || "Search failed");
        }

        const items = Array.isArray(json?.items) ? json.items : [];
        const mapped: CompanyOption[] = items.map((item: any) => ({
          identifier: String(item.identifier ?? item.id ?? ""),
          name: String(item.name ?? item.displayName ?? item.identifier ?? ""),
          subtitle: item.statusName ? String(item.statusName) : undefined,
        }));
        setOptions(mapped);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setOptions([]);
        setError(err?.message || "Search failed");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [open, query]);

  const label = value
    ? `${value.name}${value.identifier ? ` (${value.identifier})` : ""}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between min-w-[280px]", className)}
        >
          <span className="flex items-center gap-2 truncate">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span className={cn("truncate", !value && "text-muted-foreground")}>{label}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={loading ? "Searching…" : placeholder}
          />
          <CommandList>
            <CommandEmpty>
              {error
                ? error
                : query.trim().length < MIN_QUERY
                ? "Keep typing to search"
                : loading
                ? "Searching…"
                : "No results"}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.identifier}
                  value={option.identifier}
                  onSelect={() => {
                    onSelect(option);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{option.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {option.identifier}
                      {option.subtitle ? ` • ${option.subtitle}` : ""}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value?.identifier === option.identifier ? "opacity-100" : "opacity-0"
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
