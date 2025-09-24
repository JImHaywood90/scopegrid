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
CREATE UNIQUE INDEX "uniq_product_slug" ON "product_catalog" USING btree ("slug");