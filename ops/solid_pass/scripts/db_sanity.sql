-- ARKA SOLID PASS — DB sanity snapshot
\pset pager off
SELECT 'catalog.flows' AS table, COUNT(*) AS count FROM catalog.flows;
SELECT 'routing.intents' AS table, COUNT(*) AS count FROM routing.intents;
SELECT 'messages.threads' AS table, COUNT(*) AS count FROM messages.threads;
SELECT 'messages.messages' AS table, COUNT(*) AS count FROM messages.messages;
SELECT 'projects.v_project_counters' AS view, COUNT(*) AS count FROM projects.v_project_counters;
