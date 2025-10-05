-- Add catalog_id to product_match_overrides for precise matching
ALTER TABLE product_match_overrides
  ADD COLUMN IF NOT EXISTS catalog_id integer;

-- Helpful composite index for lookups by tenant/company/product
CREATE INDEX IF NOT EXISTS idx_override_tenant_company_slug_catalog
  ON product_match_overrides(fe_tenant_id, company_identifier, product_slug, catalog_id);

