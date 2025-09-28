BEGIN;

-- 1) tenants (new or alter if it already exists)
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" serial PRIMARY KEY,
  "fe_tenant_id" varchar(64) NOT NULL UNIQUE,
  "name" varchar(120),
  "stripe_customer_id" text UNIQUE,
  "stripe_subscription_id" text UNIQUE,
  "stripe_product_id" text,
  "plan_name" varchar(50),
  "subscription_status" varchar(20),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- 2) tenant_settings (ensure exists and is keyed by fe_tenant_id for one-to-one)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'tenant_settings'
  ) THEN
    CREATE TABLE "tenant_settings" (
      "id" serial PRIMARY KEY,
      "fe_tenant_id" varchar(64) NOT NULL UNIQUE,
      "subdomain" varchar(63) UNIQUE,
      "cw_configured" boolean NOT NULL DEFAULT false,
      "onboarding_completed" boolean NOT NULL DEFAULT false,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- 3) (optional) FK from tenant_settings to tenants.fe_tenant_id (kept DEFERRABLE to avoid race)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'tenant_settings_fe_tenant_id_fkey'
  ) THEN
    ALTER TABLE "tenant_settings"
    ADD CONSTRAINT "tenant_settings_fe_tenant_id_fkey"
      FOREIGN KEY ("fe_tenant_id")
      REFERENCES "tenants" ("fe_tenant_id")
      ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- 4) connectwise_credentials PK already moved to fe_tenant_id (you ran this); keep for safety
--    If this table still has an 'id' PK, convert it:
--    (Safe NOOP if you've already done the change)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='connectwise_credentials' AND column_name='id'
  ) THEN
    ALTER TABLE "connectwise_credentials" DROP CONSTRAINT IF EXISTS connectwise_credentials_pkey;
    ALTER TABLE "connectwise_credentials" DROP COLUMN IF EXISTS "id";
    ALTER TABLE "connectwise_credentials" ADD PRIMARY KEY ("fe_tenant_id");
  END IF;
END $$;

COMMIT;
