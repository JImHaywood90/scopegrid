CREATE TABLE "connectwise_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"site_url" text NOT NULL,
	"company_id_enc" text NOT NULL,
	"public_key_enc" text NOT NULL,
	"private_key_enc" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_cw_team" ON "connectwise_credentials" USING btree ("team_id");