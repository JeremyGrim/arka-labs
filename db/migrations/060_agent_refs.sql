-- 060_agent_refs.sql — référentiel d'agents importés depuis ARKA-OS
CREATE TABLE IF NOT EXISTS projects.agent_refs (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES projects.clients(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  role TEXT,
  ref TEXT NOT NULL UNIQUE,           -- e.g. 'clients/ACME/agents/pmo'
  onboarding_path TEXT NOT NULL,      -- e.g. 'ARKA_OS/ARKA_AGENT/clients/ACME/agents/pmo/onboarding.yaml'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_refs_client_agent ON projects.agent_refs(client_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_refs_client ON projects.agent_refs(client_id);
