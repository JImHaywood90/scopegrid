ALTER TABLE "product_match_overrides" RENAME COLUMN "product_id" TO "product_slug";--> statement-breakpoint
ALTER TABLE "product_match_overrides" DROP CONSTRAINT "product_match_overrides_product_id_product_catalog_id_fk";
--> statement-breakpoint
ALTER TABLE "product_match_overrides" DROP CONSTRAINT "product_match_overrides_team_id_teams_id_fk";
--> statement-breakpoint
DROP INDEX "uniq_team_product_match";--> statement-breakpoint
ALTER TABLE "product_match_overrides" ADD COLUMN "company_identifier" varchar(64);--> statement-breakpoint
ALTER TABLE "product_match_overrides" ADD CONSTRAINT "product_match_overrides_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_override_team_product_company" ON "product_match_overrides" USING btree ("team_id","product_slug","company_identifier");