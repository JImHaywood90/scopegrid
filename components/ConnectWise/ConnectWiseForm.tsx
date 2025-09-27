// components/ConnectWise/ConnectWiseForm.tsx
"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveState = { error?: string; success?: string; testing?: boolean };
type Props = {
  /** Called after a successful Save */
  onSaved?(): void;
  /** Called after a successful Test (e.g., to flip onboarding status immediately) */
  onTestSuccess?(): void;
  /** Hide the header area (compact embed) */
  compact?: boolean;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ConnectWiseForm({
  onSaved,
  onTestSuccess,
  compact,
}: Props) {
  const [siteUrl, setSiteUrl] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [state, setState] = useState<SaveState>({});

  // preload existing (siteUrl + whether creds exist)
  const { data: current, isLoading } = useSWR<{
    siteUrl?: string;
    hasCreds?: boolean;
  }>("/api/connectwise/credentials", fetcher);

  useEffect(() => {
    if (!current) return;
    setSiteUrl(current.siteUrl || "");
  }, [current]);

  async function save() {
    setState({});
    if (!siteUrl || !companyId || !publicKey || !privateKey) {
      return setState({ error: "All fields are required" });
    }
    const r = await fetch("/api/onboarding/connectwise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl, companyId, publicKey, privateKey }),
    });
    if (r.ok) {
      setCompanyId("");
      setPublicKey("");
      setPrivateKey("");
      setState({ success: "Saved" });
      onSaved?.();
    } else {
      const txt = (await r.json().catch(() => null))?.error || (await r.text());
      setState({ error: txt || "Save failed" });
    }
  }

  async function testConnection() {
    setState((s) => ({
      ...s,
      testing: true,
      error: undefined,
      success: undefined,
    }));
    const r = await fetch("/api/connectwise/test", { method: "POST" });
    if (r.ok) {
      setState({ success: "Connection OK", testing: false });
      onTestSuccess?.();
    } else {
      const txt = (await r.json().catch(() => null))?.error || (await r.text());
      setState({ error: txt || "Connection failed", testing: false });
    }
  }

  return (
    <Card
      className={cn(
        "p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60",
        "bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all"
      )}
    >
      {!compact && (
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {!compact && (
          <div className="mb-2 flex items-center gap-3">
            <Image
              src="/connectwise.png"
              alt="ConnectWise"
              width={48}
              height={48}
              className="h-10 w-auto lg:h-12"
              priority
            />
            <div className="text-base font-medium">ConnectWise</div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div>
              <Label htmlFor="siteUrl">Site URL (region base)</Label>
              <Input
                id="siteUrl"
                placeholder="https://api-na.myconnectwise.net"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                placeholder="yourcwcompany"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="publicKey">Public Key</Label>
                <Input
                  id="publicKey"
                  placeholder="public key"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="privateKey">Private Key</Label>
                <Input
                  id="privateKey"
                  placeholder="private key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  type="password"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Keys are <b>encrypted at rest</b>. We never render them after
              save.
            </p>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-3">
        <Button
          onClick={save}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Save
        </Button>
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={state.testing}
        >
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
        {state.error && (
          <span className="text-red-600 ml-2">{state.error}</span>
        )}
        {state.success && (
          <span className="text-green-700 ml-2">{state.success}</span>
        )}
      </CardFooter>
    </Card>
  );
}
