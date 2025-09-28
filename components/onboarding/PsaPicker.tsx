'use client';

import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Props = {
  value: 'connectwise' | 'halo';
  onChange: (v: 'connectwise' | 'halo') => void;
};

export default function PSAPicker({ value, onChange }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border-slate-200/70 dark:border-slate-700/60 p-4',
        'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
      )}
    >
      <Label className="text-sm">Select your PSA</Label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as any)} className="mt-3 grid gap-3 sm:grid-cols-2">
        {/* ConnectWise */}
        <Card
          className={cn(
            'p-4 flex items-center gap-3 border cursor-pointer',
            value === 'connectwise' ? 'ring-2 ring-orange-500' : ''
          )}
          onClick={() => onChange('connectwise')}
        >
          <RadioGroupItem id="psa-cw" value="connectwise" />
          <Label htmlFor="psa-cw" className="flex items-center gap-3 cursor-pointer">
            <Image src="/connectwise.png" alt="ConnectWise" width={28} height={28} />
            ConnectWise
          </Label>
        </Card>

        {/* Halo (coming soon) */}
        <Card
          className={cn(
            'p-4 flex items-center gap-3 border cursor-pointer',
            value === 'halo' ? 'ring-2 ring-orange-500' : ''
          )}
          onClick={() => onChange('halo')}
        >
          <RadioGroupItem id="psa-halo" value="halo" />
          <Label htmlFor="psa-halo" className="flex items-center gap-3 cursor-not-allowed">
            <Image src="/halo.png" alt="Halo PSA" width={28} height={28} />
            Halo (beta)
          </Label>
        </Card>
      </RadioGroup>
    </div>
  );
}
