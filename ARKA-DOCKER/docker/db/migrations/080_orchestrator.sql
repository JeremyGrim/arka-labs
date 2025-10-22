-- 080_orchestrator.sql — sessions & steps d'orchestration
CREATE SCHEMA IF NOT EXISTS runtime;

CREATE TABLE IF NOT EXISTS runtime.orch_sessions (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  flow_ref TEXT NOT NULL,
  runner_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'running', -- running|paused|completed|failed
  current_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtime.orch_steps (
  id TEXT PRIMARY KEY,
  orch_id TEXT NOT NULL REFERENCES runtime.orch_sessions(id) ON DELETE CASCADE,
  idx INT NOT NULL,
  name TEXT,
  role TEXT,
  agent_ref TEXT,
  gate TEXT, -- AGP|ARCHIVISTE
  status TEXT NOT NULL DEFAULT 'pending', -- pending|running|gated|completed|failed
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION runtime.set_updated_at_orch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_orch_sessions_updated') THEN
    CREATE TRIGGER trg_orch_sessions_updated BEFORE UPDATE ON runtime.orch_sessions
    FOR EACH ROW EXECUTE PROCEDURE runtime.set_updated_at_orch();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orch_steps_orch ON runtime.orch_steps(orch_id);
CREATE INDEX IF NOT EXISTS idx_orch_steps_status ON runtime.orch_steps(status);
