// lib/db/schema.v2.ts
import {
  pgTable, serial, varchar, text, timestamp, boolean, jsonb, uniqueIndex,
  integer
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Minimal mirror tables (optional) if you want to cache user display info:
export const appUsers = pgTable('app_users', {
  id: serial('id').primaryKey(),
  feUserId: varchar('fe_user_id', { length: 64 }).notNull().unique(),  // Frontegg user id
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 120 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Your “team” becomes a tenant row keyed by Frontegg tenant id:
export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  feTenantId: varchar('fe_tenant_id', { length: 64 }).notNull().unique(), // Frontegg tenant id
  name: varchar('name', { length: 120 }), // optional display
  // billing fields stay here (Stripe IDs, plan, status)
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tenant-scoped settings
export const tenantSettings = pgTable('tenant_settings', {
  id: serial('id').primaryKey(),
  feTenantId: varchar('fe_tenant_id', { length: 64 }).notNull().unique(),
  subdomain: varchar('subdomain', { length: 63 }).unique(),
  cwConfigured: boolean('cw_configured').notNull().default(false),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ConnectWise creds scoped by tenant
export const connectwiseCredentials = pgTable('connectwise_credentials', {
  // PK is fe_tenant_id now
  feTenantId: varchar('fe_tenant_id', { length: 64 }).primaryKey(),
  siteUrl: text('site_url').notNull(),
  companyIdEnc: text('company_id_enc').notNull(),
  publicKeyEnc: text('public_key_enc').notNull(),
  privateKeyEnc: text('private_key_enc').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Product catalog is global (unchanged)
export const productCatalog = pgTable('product_catalog', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  vendor: varchar('vendor', { length: 120 }),
  category: varchar('category', { length: 80 }),
  description: text('description'),
  logoLightPath: text('logo_light_path').notNull(),
  logoDarkPath: text('logo_dark_path'),
  tags: text('tags').array().$type<string[]>().default([]),
  matchTerms: text('match_terms').array().$type<string[]>().notNull().default([]),
  links: jsonb('links').$type<Record<string, string>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniqSlug: uniqueIndex('uniq_product_slug').on(t.slug),
}));

// Per-tenant overrides
export const productMatchOverrides = pgTable('product_match_overrides', {
  id: serial('id').primaryKey(),
  feTenantId: varchar('fe_tenant_id', { length: 64 }).notNull(),
  productSlug: varchar('product_slug', { length: 64 }).notNull(),
  companyIdentifier: varchar('company_identifier', { length: 120 }),
  terms: text('terms').array().$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniqTenantProdCompany: uniqueIndex('uniq_override_tenant_product_company')
    .on(t.feTenantId, t.productSlug, t.companyIdentifier),
}));

// Integrations (BackupRadar, CIPP, SmileBack...)
export const tenantIntegrations = pgTable('tenant_integrations', {
  id: serial('id').primaryKey(),
  feTenantId: varchar('fe_tenant_id', { length: 64 }).notNull(),
  slug: varchar('slug', { length: 64 }).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
  connected: boolean('connected').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniqTenantIntegration: uniqueIndex('uniq_tenant_integration').on(t.feTenantId, t.slug),
}));

// Activity (optional, now tenant-scoped by feTenantId + feUserId)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  feTenantId: varchar('fe_tenant_id', { length: 64 }).notNull(),
  feUserId: varchar('fe_user_id', { length: 64 }),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const productMatchExclusions = pgTable('product_match_exclusions', {
  id: serial('id').primaryKey(),
  feTenantId: varchar('fe_tenant_id', { length: 64 }).notNull(),
  companyIdentifier: varchar('company_identifier', { length: 120 }).notNull(),
  entityType: varchar('entity_type', { length: 20 }).notNull(), // 'addition' | 'configuration'
  entityId: integer('entity_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  uniqExcl: uniqueIndex('uniq_exclusion_tenant_company_entity')
    .on(t.feTenantId, t.companyIdentifier, t.entityType, t.entityId),
}));