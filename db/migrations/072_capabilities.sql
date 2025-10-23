-- 072_capabilities.sql — index et trigger de mise à jour pour catalog.capabilities
CREATE INDEX IF NOT EXISTS idx_capabilities_domain ON catalog.capabilities (domain);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_catalog_caps_updated') THEN
    CREATE TRIGGER trg_catalog_caps_updated
      BEFORE UPDATE ON catalog.capabilities
      FOR EACH ROW EXECUTE PROCEDURE catalog.touch_updated_at();
  END IF;
END
$$;
