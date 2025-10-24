-- 061_client_agents.sql — vue annuaire agents par client (code)
CREATE OR REPLACE VIEW projects.v_client_agents AS
SELECT 
  c.code AS client_code,
  a.agent_id,
  a.role,
  a.ref,
  a.onboarding_path,
  a.state,
  a.context_status,
  a.created_at
FROM projects.agent_refs a
JOIN projects.clients c ON c.id = a.client_id;
