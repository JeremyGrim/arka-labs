-- views/project_counters.sql — métriques projet
CREATE OR REPLACE VIEW projects.v_project_counters AS
SELECT 
  p.id   AS project_id,
  p.key  AS project_key,
  p.title,
  COUNT(DISTINCT t.id)  AS threads_count,
  COUNT(m.id)           AS messages_count,
  COALESCE(MAX(m.created_at), MAX(t.created_at)) AS last_activity
FROM projects.projects p
LEFT JOIN messages.threads t ON t.project_id = p.id
LEFT JOIN messages.messages m ON m.thread_id = t.id
GROUP BY p.id, p.key, p.title;
