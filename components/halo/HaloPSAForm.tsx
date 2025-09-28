// components/Halo/HaloPSAForm.tsx
'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlugZap } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  compact?: boolean;
  onSaved?: () => void;
  onTestSuccess?: () => void;
};
type SaveState = { error?: string; success?: string; testing?: boolean };

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function HaloPSAForm({ compact, onSaved, onTestSuccess }: Props) {
  const { data, isLoading } = useSWR<{ baseUrl?: string; scope?: string }>(
    '/api/halo/credentials',
    fetcher
  );

  const [baseUrl, setBaseUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [scope, setScope] = useState('all');
  const [state, setState] = useState<SaveState>({});

  useEffect(() => {
    if (!data) return;
    setBaseUrl(data.baseUrl || '');
    setScope(data.scope || 'all');
  }, [data]);

  async function save() {
    setState({});
    if (!baseUrl || !clientId || !clientSecret) {
      return setState({ error: 'All fields are required' });
    }
    const r = await fetch('/api/halo/credentials', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ baseUrl, clientId, clientSecret, scope }),
    });
    if (r.ok) {
      setClientSecret('');
      setState({ success: 'Saved' });
      onSaved?.();
    } else {
      const txt = (await r.json().catch(() => null))?.error || (await r.text());
      setState({ error: txt || 'Save failed' });
    }
  }

  async function test() {
    setState(s => ({ ...s, testing: true, error: undefined, success: undefined }));
    const r = await fetch('/api/halo/test', { method: 'POST' });
    if (r.ok) {
      setState({ success: 'Connection OK', testing: false });
      onTestSuccess?.();
    } else {
      const txt = (await r.json().catch(() => null))?.error || (await r.text());
      setState({ error: txt || 'Connection failed', testing: false });
    }
  }

  return (
    <Card
      className={cn(
        'p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60',
        'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
      )}
    >
      {!compact && (
        <CardHeader>
          <CardTitle>Halo PSA – API Credentials</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {!compact && (
          <div className="mb-2 flex items-center gap-3">
            <Image
              src="/halo.png" // add a logo to /public/halo.png if you like
              alt="Halo PSA"
              width={48}
              height={48}
              className="h-10 w-auto lg:h-12"
              priority
            />
            <div className="text-base font-medium">Halo PSA</div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div>
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://YOURSUBDOMAIN.halopsa.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="client id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="client secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="scope">Scope</Label>
              <Input
                id="scope"
                placeholder="all"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Halo typically requires <code>all</code> for broad access in client-credentials flows.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Secrets are <b>encrypted at rest</b>. We never render them after save.
            </p>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-3">
        <Button onClick={save} className="bg-orange-500 hover:bg-orange-600 text-white">
          Save
        </Button>
        <Button variant="outline" onClick={test} disabled={state.testing}>
          {state.testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing…
            </>
          ) : (
            <>
              <PlugZap className="mr-2 h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>
        {state.error && <span className="text-red-600 ml-2">{state.error}</span>}
        {state.success && <span className="text-green-700 ml-2">{state.success}</span>}
      </CardFooter>
    </Card>
  );
}
