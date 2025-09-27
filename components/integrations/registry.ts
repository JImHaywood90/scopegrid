// components/integrations/registry.ts
export type IntegrationField =
  | { type: 'text'; name: string; label: string; placeholder?: string; required?: boolean }
  | { type: 'password'; name: string; label: string; placeholder?: string; required?: boolean }
  | { type: 'url'; name: string; label: string; placeholder?: string; required?: boolean };

export type IntegrationMeta = {
  slug: string;
  name: string;
  logoLight: string;
  logoDark?: string;
  description?: string;
  fields: IntegrationField[];
};

export const INTEGRATIONS: IntegrationMeta[] = [
  // {
  //   slug: 'connectwise',
  //   name: 'ConnectWise',
  //   logoLight: '/connectwise.png',
  //   logoDark: '/connectwise-dark.png', // optional
  //   description: 'Pull agreements, additions & configurations.',
  //   fields: [
  //     { type: 'url', name: 'siteUrl', label: 'Site URL', placeholder: 'https://api-na.myconnectwise.net', required: true },
  //     { type: 'text', name: 'companyId', label: 'Company ID', required: true },
  //     { type: 'text', name: 'publicKey', label: 'Public Key', required: true },
  //     { type: 'password', name: 'privateKey', label: 'Private Key', required: true },
  //   ],
  // },
  {
    slug: 'backupradar',
    name: 'BackupRadar',
    logoLight: '/integrations/backupradar.png',
    description: 'Surface backup failures by client.',
    fields: [
      { type: 'url', name: 'baseUrl', label: 'Base URL', placeholder: 'https://api.backupradar.com', required: true },
      { type: 'password', name: 'apiKey', label: 'API Key', required: true },
    ],
  },
  {
    slug: 'cipp',
    name: 'CIPP',
    logoLight: '/integrations/cipp.png',
    description: 'Microsoft 365 tenant posture & tasks.',
    fields: [
      { type: 'url', name: 'baseUrl', label: 'Base URL', placeholder: 'https://cipp.example.com', required: true },
      { type: 'password', name: 'apiKey', label: 'API Key', required: true },
    ],
  },
  {
    slug: 'smileback',
    name: 'SmileBack',
    logoLight: '/integrations/smileback.png',
    description: 'CSAT & NPS feedback.',
    fields: [
      { type: 'url', name: 'baseUrl', label: 'Base URL', placeholder: 'https://api.smileback.com', required: true },
      { type: 'password', name: 'apiKey', label: 'API Key', required: true },
    ],
  },
];

export const bySlug = Object.fromEntries(INTEGRATIONS.map((i) => [i.slug, i]));
