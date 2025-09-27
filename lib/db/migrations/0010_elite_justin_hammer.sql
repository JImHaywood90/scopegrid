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
ALTER TABLE "invitations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "teams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "invitations" CASCADE;--> statement-breakpoint
DROP TABLE "team_members" CASCADE;--> statement-breakpoint
DROP TABLE "teams" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "tenant_settings" DROP CONSTRAINT "tenant_settings_team_id_unique";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "connectwise_credentials" DROP CONSTRAINT "connectwise_credentials_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "tenant_integrations" DROP CONSTRAINT "tenant_integrations_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "tenant_settings" DROP CONSTRAINT "tenant_settings_team_id_teams_id_fk";
--> statement-breakpoint
DROP INDEX "uniq_cw_team";--> statement-breakpoint
DROP INDEX "uniq_override_team_product_company";--> statement-breakpoint
DROP INDEX "uniq_team_integration";--> statement-breakpoint
ALTER TABLE "connectwise_credentials" ALTER COLUMN "id" SET DATA TYPE varchar(40);--> statement-breakpoint
ALTER TABLE "connectwise_credentials" ALTER COLUMN "id" SET DEFAULT 'cw';--> statement-breakpoint
ALTER TABLE "tenant_settings" ALTER COLUMN "subdomain" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "fe_tenant_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "fe_user_id" varchar(64);--> statement-breakpoint
ALTER TABLE "connectwise_credentials" ADD COLUMN "fe_tenant_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "product_match_overrides" ADD COLUMN "fe_tenant_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "fe_tenant_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "fe_tenant_id" varchar(64) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_override_tenant_product_company" ON "product_match_overrides" USING btree ("fe_tenant_id","product_slug","company_identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_integration" ON "tenant_integrations" USING btree ("fe_tenant_id","slug");--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "connectwise_credentials" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "product_match_overrides" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "tenant_integrations" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "tenant_settings" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "connectwise_credentials" ADD CONSTRAINT "connectwise_credentials_fe_tenant_id_unique" UNIQUE("fe_tenant_id");--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_fe_tenant_id_unique" UNIQUE("fe_tenant_id");