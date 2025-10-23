-- 071_catalog_flows.sql — index et trigger de mise à jour pour catalog.flows
CREATE INDEX IF NOT EXISTS idx_flows_intent ON catalog.flows (intent);
CREATE INDEX IF NOT EXISTS idx_flows_family ON catalog.flows (family);
CREATE INDEX IF NOT EXISTS idx_flows_tags_gin ON catalog.flows USING GIN (tags);

CREATE OR REPLACE FUNCTION catalog.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_catalog_flows_updated') THEN
    CREATE TRIGGER trg_catalog_flows_updated
      BEFORE UPDATE ON catalog.flows
      FOR EACH ROW EXECUTE PROCEDURE catalog.touch_updated_at();
  END IF;
END
$$;
