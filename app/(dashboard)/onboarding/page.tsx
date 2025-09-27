// app/onboarding/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function OnboardingPage() {
  const router = useRouter();
  const { data: settings } = useSWR('/api/tenant-settings', fetcher);

  useEffect(() => {
    // Bootstrap rows on first load
    fetch('/api/bootstrap', { method: 'POST' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (settings?.onboardingCompleted) {
      router.replace('/dashboard');
    }
  }, [settings, router]);

  const [siteUrl, setSiteUrl] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch('/api/onboarding/connectwise', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl, companyId, publicKey, privateKey }),
    });
    setBusy(false);
    if (!r.ok) { const j = await r.json().catch(()=>null); setErr(j?.error || 'Failed'); return; }
    router.replace('/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>ConnectWise Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input id="siteUrl" value={siteUrl} onChange={e=>setSiteUrl(e.target.value)} required placeholder="https://na.myconnectwise.net"/>
            </div>
            <div>
              <Label htmlFor="companyId">Company ID</Label>
              <Input id="companyId" value={companyId} onChange={e=>setCompanyId(e.target.value)} required/>
            </div>
            <div>
              <Label htmlFor="publicKey">Public Key</Label>
              <Input id="publicKey" value={publicKey} onChange={e=>setPublicKey(e.target.value)} required/>
            </div>
            <div>
              <Label htmlFor="privateKey">Private Key</Label>
              <Input id="privateKey" value={privateKey} onChange={e=>setPrivateKey(e.target.value)} required type="password"/>
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save & Continue'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
