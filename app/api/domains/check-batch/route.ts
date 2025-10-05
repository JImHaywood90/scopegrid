// src/app/api/domains/check-batch/route.ts
import { promises as dns } from "dns";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type DnsCheckResult = {
  SPF: string[];
  DMARC: string[];
  DKIM: string[];
  NS: string[] | string;
  ARecord: string;
  EmailProvider: string;
  Domain: string;
  error?: string;
};

const DKIM_SELECTORS = [
  "google._domainkey",
  "selector1._domainkey",
  "selector2._domainkey",
  "everlytickey1._domainkey",
  "everlytickey2._domainkey",
  "eversrv._domainkey",
  "k1._domainkey",
  "mxvault._domainkey",
  "dkim._domainkey",
];

async function getARecord(domain: string): Promise<string> {
  try {
    const result = await dns.lookup(domain);
    return result?.address || "No record found";
  } catch {
    return "No record found";
  }
}

async function getSpfRecord(domain: string): Promise<string[]> {
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spf = txtRecords.flat().filter((txt) => /v=spf/i.test(txt));
    return spf.length > 0 ? spf : ["No record found"];
  } catch {
    return ["No record found"];
  }
}

async function getDmarcRecord(domain: string): Promise<string[]> {
  try {
    const dmarc = await dns.resolveTxt(`._dmarc.${domain}`.replace(/^\.*/, "_dmarc."));
    return dmarc.flat().length > 0 ? dmarc.flat() : ["No record found"];
  } catch {
    return ["No record found"];
  }
}

async function getNsRecord(domain: string): Promise<string[] | string> {
  try {
    return await dns.resolveNs(domain);
  } catch {
    return "No record found";
  }
}

function getEmailProviderBySelector(selector: string): string {
  switch (selector) {
    case "google._domainkey":
      return "Google";
    case "selector1._domainkey":
    case "selector2._domainkey":
      return "Microsoft";
    case "everlytickey1._domainkey":
    case "everlytickey2._domainkey":
    case "eversrv._domainkey":
      return "Everlytic";
    case "k1._domainkey":
      return "MailChimp / Mandrill";
    case "mxvault._domainkey":
      return "Global Micro";
    case "dkim._domainkey":
      return "Hetzner";
    default:
      return "Unknown";
  }
}

async function resolveDkim(domain: string): Promise<{ dkim: string[]; provider: string }> {
  for (const selector of DKIM_SELECTORS) {
    try {
      const records = await dns.resolveTxt(`${selector}.${domain}`);
      if (records.length > 0) {
        return {
          dkim: records.flat(),
          provider: getEmailProviderBySelector(selector),
        };
      }
    } catch {
      // try next selector
    }
  }
  return { dkim: ["No record found"], provider: "Unknown" };
}

async function checkOne(domain: string): Promise<DnsCheckResult> {
  try {
    const [aRecord, spf, dmarc, ns, { dkim, provider }] = await Promise.all([
      getARecord(domain),
      getSpfRecord(domain),
      getDmarcRecord(domain),
      getNsRecord(domain),
      resolveDkim(domain),
    ]);

    return {
      ARecord: aRecord,
      SPF: spf,
      DMARC: dmarc,
      DKIM: dkim,
      NS: ns,
      EmailProvider: provider,
      Domain: domain,
    };
  } catch (e: any) {
    return {
      ARecord: "No record found",
      SPF: ["No record found"],
      DMARC: ["No record found"],
      DKIM: ["No record found"],
      NS: "No record found",
      EmailProvider: "Unknown",
      Domain: domain,
      error: e?.message || "Lookup failed",
    };
  }
}

export async function POST(req: NextRequest) {
  const { domains } = (await req.json().catch(() => ({}))) as { domains?: string[] };
  if (!Array.isArray(domains) || domains.length === 0) {
    return NextResponse.json({ error: "Provide { domains: string[] }" }, { status: 400 });
  }

  const unique = Array.from(new Set(domains.map((d) => String(d || "").trim()).filter(Boolean)));
  const results = await Promise.all(unique.map((d) => checkOne(d)));
  const map = Object.fromEntries(results.map((r) => [r.Domain, r]));
  return NextResponse.json({ results: map }, { headers: { "Cache-Control": "no-store" } });
}
