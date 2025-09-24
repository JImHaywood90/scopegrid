'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TeamDataWithMembers } from '@/lib/db/schema';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ConnectWiseForm from '@/components/ConnectWise/ConnectWiseForm';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function OnboardingPage() {
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const teamId = team?.id;

  // subdomain
  const [subdomain, setSubdomain] = useState('');
  const [sdState, setSdState] = useState<{ok?:boolean; error?:string}>({});

  // cw state flags
  const [cwOk, setCwOk] = useState(false);

  // read current tenant settings to prefill (optional)
  useEffect(() => {
    if (!teamId) return;
    (async () => {
      const r = await fetch(`/api/tenant-settings?teamId=${teamId}`).catch(() => null);
      if (r?.ok) {
        const j = await r.json();
        setSubdomain(j?.subdomain || '');
        setCwOk(Boolean(j?.cwConfigured));
      }
    })();
  }, [teamId]);

  async function saveSubdomain() {
    setSdState({});
    if (!teamId || !subdomain) return setSdState({ error: 'Enter a subdomain' });
    const r = await fetch('/api/onboarding/subdomain', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, subdomain }),
    });
    if (r.ok) setSdState({ ok: true });
    else setSdState({ error: await r.text() });
  }

  async function complete() {
    if (!teamId) return;
    const r = await fetch('/api/onboarding/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    });
    if (r.ok) window.location.href = '/dashboard';
    else alert(await r.text());
  }

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Image src="/ScopeGridLogoLight.png" alt="ScopeGrid" width={160} height={40} className="h-10 w-auto" />
        <span className="text-sm text-gray-500">Onboarding</span>
      </div>

      {/* Step 1: subdomain */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>1) Claim your subdomain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-[auto,1fr,auto] gap-3 items-end">
            <Label className="sr-only" htmlFor="subdomain">Subdomain</Label>
            <div className="text-gray-600 hidden sm:block">https://</div>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                placeholder="acme"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
              />
              <div className="text-gray-600 hidden sm:block">.scopegrid.app</div>
            </div>
            <Button onClick={saveSubdomain}>Save</Button>
          </div>
          {sdState.error && <p className="text-red-600 mt-2">{sdState.error}</p>}
          {sdState.ok && <p className="text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Saved</p>}
        </CardContent>
      </Card>

      {/* Step 2: ConnectWise (reuse your page content via link or embed the form) */}
      <Card className="mb-6">
        <CardHeader>
            <CardTitle>2) Add & test ConnectWise keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
            Enter your credentials and click <b>Test Connection</b>. We’ll mark this step as complete automatically.
            </p>

            {/* Embed the CW form here (no redirect). We pass teamId if you already have it */}
            <ConnectWiseForm
            teamId={teamId}
            compact
            onTestSuccess={() => {
                setCwOk(true);        // immediately reflect in UI
            }}
            />
        </CardContent>
      </Card>
      
      {/* Step 3: Finish */}
      <Card>
        <CardHeader>
          <CardTitle>3) Finish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            When your subdomain is saved and ConnectWise test passes, you’re ready to go.
          </p>
          <div className="flex gap-2">
            <Button onClick={complete} disabled={!sdState.ok || !cwOk}>
              Complete onboarding
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Refresh status
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Status: subdomain {sdState.ok ? '✅' : '❌'} • ConnectWise {cwOk ? '✅' : '❌'}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
