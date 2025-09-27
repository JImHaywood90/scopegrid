'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { ExternalLink } from 'lucide-react';
import type { ProductLite } from './types';

export default function ProductSelect({
  products,
  value,
  onChange,
  placeholder = 'Pick a product…',
  className,
}: {
  products: ProductLite[];
  value?: string;
  onChange: (slug: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const label = value ? products.find((p) => p.slug === value)?.name ?? value : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={`justify-between w-[260px] ${className || ''}`}>
          <span className="truncate">{label || placeholder}</span>
          <ExternalLink className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search products…" />
          <CommandList>
            <CommandEmpty>No products.</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.slug}
                  value={p.slug}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.vendor || p.category || p.slug}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
