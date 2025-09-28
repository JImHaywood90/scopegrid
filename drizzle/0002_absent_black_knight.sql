CREATE TABLE "halo_credentials" (
	"fe_tenant_id" varchar(64) PRIMARY KEY NOT NULL,
	"base_url" text NOT NULL,
	"client_id_enc" text NOT NULL,
	"client_secret_enc" text NOT NULL,
	"scope" text DEFAULT 'all',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
