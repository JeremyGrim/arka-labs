-- 074_views_compat.sql — vue annuaire agents (compat lot 05/07)
DO $_lot07_$
DECLARE
  has_client_id BOOLEAN;
  has_client_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'projects' AND table_name = 'agent_refs' AND column_name = 'client_id'
  ) INTO has_client_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'projects' AND table_name = 'agent_refs' AND column_name = 'client'
  ) INTO has_client_column;

  IF has_client_id THEN
    EXECUTE $$
      CREATE OR REPLACE VIEW projects.v_client_agents AS
      SELECT c.code AS client_code,
             ar.agent_id,
             ar.role,
             ar.ref,
             ar.onboarding_path,
             ar.created_at
      FROM projects.agent_refs ar
      JOIN projects.clients c ON c.id = ar.client_id;
    $$;
  ELSIF has_client_column THEN
    EXECUTE $$
      CREATE OR REPLACE VIEW projects.v_client_agents AS
      SELECT ar.client AS client_code,
             ar.agent_id,
             ar.role,
             ar.ref,
             ar.onboarding_path,
             ar.created_at
      FROM projects.agent_refs ar;
    $$;
  END IF;
END
$_lot07_$;
