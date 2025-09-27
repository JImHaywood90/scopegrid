CREATE TABLE "product_match_exclusions" (
	"id" serial PRIMARY KEY NOT NULL,
	"fe_tenant_id" varchar(64) NOT NULL,
	"company_identifier" varchar(120) NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" integer NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
