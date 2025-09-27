'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import CompanyPicker from '@/components/ConnectWise/company-picker';
import { Input } from '@/components/ui/input';

export default function DashboardCenter() {
  const router = useRouter();
  const sp = useSearchParams();
  const qParam = sp?.get('q') ?? '';

  function setQs(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp?.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    router.replace(`/dashboard?${params.toString()}`);
  }

  return (
    <>
      <CompanyPicker className="w-[280px] shrink-0" onChanged={() => router.refresh()} />
      <Input
        placeholder="Search products…"
        defaultValue={qParam}
        className="w-40 sm:w-56 md:w-64 shrink-0"
        onChange={(e) => setQs({ q: e.currentTarget.value })}
      />
    </>
  );
}
