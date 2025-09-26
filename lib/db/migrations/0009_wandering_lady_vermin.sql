CREATE TABLE "tenant_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"slug" varchar(64) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"connected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_match_overrides" DROP CONSTRAINT "product_match_overrides_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "product_match_overrides" ALTER COLUMN "company_identifier" SET DATA TYPE varchar(120);--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD CONSTRAINT "tenant_integrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_team_integration" ON "tenant_integrations" USING btree ("team_id","slug");