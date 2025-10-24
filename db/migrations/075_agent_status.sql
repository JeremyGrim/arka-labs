-- 075_agent_status.sql — état et contexte des agents client
ALTER TABLE projects.agent_refs
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'awake',
  ADD COLUMN IF NOT EXISTS context_status TEXT NOT NULL DEFAULT 'nominal';

ALTER TABLE projects.agent_refs
  DROP CONSTRAINT IF EXISTS chk_agent_refs_state,
  DROP CONSTRAINT IF EXISTS chk_agent_refs_context_status;

ALTER TABLE projects.agent_refs
  ADD CONSTRAINT chk_agent_refs_state
    CHECK (state IN ('awake', 'sleep', 'degraded')),
  ADD CONSTRAINT chk_agent_refs_context_status
    CHECK (context_status IN ('nominal', 'low', 'critical'));

CREATE INDEX IF NOT EXISTS idx_agent_refs_state ON projects.agent_refs(state);
CREATE INDEX IF NOT EXISTS idx_agent_refs_context_status ON projects.agent_refs(context_status);
