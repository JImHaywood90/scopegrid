CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"fe_tenant_id" varchar(64) NOT NULL,
	"fe_user_id" varchar(64),
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"fe_user_id" varchar(64) NOT NULL,
	"email" varchar(255),
	"name" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_users_fe_user_id_unique" UNIQUE("fe_user_id")
);
--> statement-breakpoint
CREATE TABLE "connectwise_credentials" (
	"id" varchar(40) PRIMARY KEY DEFAULT 'cw' NOT NULL,
	"fe_tenant_id" varchar(64) NOT NULL,
	"site_url" text NOT NULL,
	"company_id_enc" text NOT NULL,
	"public_key_enc" text NOT NULL,
	"private_key_enc" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "connectwise_credentials_fe_tenant_id_unique" UNIQUE("fe_tenant_id")
);
--> statement-breakpoint
CREATE TABLE "product_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"vendor" varchar(120),
	"category" varchar(80),
	"description" text,
	"logo_light_path" text NOT NULL,
	"logo_dark_path" text,
	"tags" text[] DEFAULT '{}',
	"match_terms" text[] DEFAULT '{}' NOT NULL,
	"links" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_match_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"fe_tenant_id" varchar(64) NOT NULL,
	"product_slug" varchar(64) NOT NULL,
	"company_identifier" varchar(120),
	"terms" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"fe_tenant_id" varchar(64) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"connected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"fe_tenant_id" varchar(64) NOT NULL,
	"subdomain" varchar(63),
	"cw_configured" boolean DEFAULT false NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_settings_fe_tenant_id_unique" UNIQUE("fe_tenant_id"),
	CONSTRAINT "tenant_settings_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"fe_tenant_id" varchar(64) NOT NULL,
	"name" varchar(120),
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"plan_name" varchar(50),
	"subscription_status" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_fe_tenant_id_unique" UNIQUE("fe_tenant_id"),
	CONSTRAINT "tenants_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "tenants_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_product_slug" ON "product_catalog" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_override_tenant_product_company" ON "product_match_overrides" USING btree ("fe_tenant_id","product_slug","company_identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_integration" ON "tenant_integrations" USING btree ("fe_tenant_id","slug");