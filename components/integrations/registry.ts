// components/integrations/registry.ts
export type IntegrationField =
  | {
      type: "text";
      name: string;
      label: string;
      placeholder?: string;
      required?: boolean;
    }
  | {
      type: "password";
      name: string;
      label: string;
      placeholder?: string;
      required?: boolean;
    }
  | {
      type: "url";
      name: string;
      label: string;
      placeholder?: string;
      required?: boolean;
    };

export type IntegrationMeta = {
  slug: string;
  name: string;
  logoLight: string;
  logoDark?: string;
  description?: string;
  fields: IntegrationField[];
  highlight?: { text: string; color: "blue" | "indigo" | "amber" };
  tags?: string[];
};

export const INTEGRATIONS: IntegrationMeta[] = [
  {
    slug: "auvik",
    name: "Auvik",
    logoLight: "/logos/square/auvik.png",
    description:
      "Network monitoring and topology with device health, alerts, and bandwidth usage across client sites.",
    highlight: { text: "● Networks", color: "indigo" },
    tags: ["Device health", "Alerts"],
    fields: [
      {
        type: "url",
        name: "baseUrl",
        label: "Base URL",
        placeholder: "https://auvikapi.us1.my.auvik.com",
        required: true,
      },
      {
        type: "text",
        name: "username",
        label: "Username (email)",
        required: true,
      },
      {
        type: "password",
        name: "apiKey",
        label: "API Key",
        required: true,
      },
    ],
  },
  {
    slug: "itglue",
    name: "IT Glue",
    logoLight: "/logos/square/itglue.png",
    logoDark: "/logos/square/itglue.png", // optional
    description:
      "Embed company dashboard in Each organisation's Quick Notes or Flexible Assets. Deploy automatically.",
    highlight: { text: "● Quick Refs", color: "blue" },
    tags: ["Per-client views", "Zero agents"],
    fields: [
      {
        type: "url",
        name: "siteUrl",
        label: "Site URL",
        placeholder: "https://*.itglue.net",
        required: true,
      },
      { type: "text", name: "companyId", label: "Company ID", required: true },
      { type: "text", name: "publicKey", label: "Public Key", required: true },
      {
        type: "password",
        name: "privateKey",
        label: "Private Key",
        required: true,
      },
    ],
  },
  {
    slug: "backupradar",
    name: "BackupRadar",
    logoLight: "/integrations/backupradar.png",
    description:
      "Surface backup failures and history by client and integration.",
    highlight: { text: "● Health signals", color: "blue" },
    tags: ["Client rollups", "Drill-downs"],
    fields: [
      { name: "baseUrl", label: "Base URL", type: "text" },
      { name: "apiKey", label: "API Key", type: "password" },
    ],
  },
  {
    slug: "meraki",
    name: "Meraki",
    logoLight: "/logos/square/meraki.png",
    description:
      "Check network status, license expiry, and device health for Meraki organizations.",
    highlight: { text: "● Networking", color: "indigo" },
    tags: ["Device status", "License expiry", "Client networks"],
    fields: [
      {
        type: "url",
        name: "baseUrl",
        label: "Base URL",
        placeholder: "https://api.meraki.com/api/v1",
      },
      {
        type: "password",
        name: "apiKey",
        label: "API Key",
        required: true,
      },
    ],
  },
  {
    slug: "cipp",
    name: "CIPP",
    logoLight: "/integrations/cipp.png",
    description:
      "Microsoft 365 tenant posture & tasks. Check tenant licenses, secure score status, partners, and more.",
    highlight: { text: "● Posture", color: "indigo" },
    tags: ["Secure score", "Task links"],
    fields: [
      {
        type: "url",
        name: "baseUrl",
        label: "Base URL",
        placeholder: "https://cipp.example.com",
        required: true,
      },
      {
        type: "text",
        name: "tenantId",
        label: "Azure Tenant ID",
        required: true,
      },
      {
        type: "text",
        name: "clientId",
        label: "Client ID",
        required: true,
      },
      {
        type: "password",
        name: "clientSecret",
        label: "Client Secret",
        required: true,
      },
      {
        type: "text",
        name: "scope",
        label: "OAuth Scope",
        placeholder: "api://<client-id>/.default",
      },
    ],
  },
  {
    slug: "smileback",
    name: "SmileBack",
    logoLight: "/integrations/smileback.png",
    description:
      "CSAT & NPS feedback from end-users, linked to tickets and clients and easily viewed.",
    highlight: { text: "● Feedback", color: "amber" },
    tags: ["Trends", "Ticket links"],
    fields: [
      {
        type: "url",
        name: "baseUrl",
        label: "API Base URL",
        placeholder: "https://app.smileback.io/api/v3",
        required: true,
      },
      {
        type: "text",
        name: "clientId",
        label: "Client ID",
        required: true,
      },
      {
        type: "password",
        name: "clientSecret",
        label: "Client Secret",
        required: true,
      },
      {
        type: "text",
        name: "username",
        label: "Username",
        required: true,
      },
      {
        type: "password",
        name: "password",
        label: "Password",
        required: true,
      },
    ],
  },
];

export const bySlug = Object.fromEntries(INTEGRATIONS.map((i) => [i.slug, i]));
