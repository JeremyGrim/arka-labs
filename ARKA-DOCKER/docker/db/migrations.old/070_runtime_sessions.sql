-- 070_runtime_sessions.sql — sessions runner
CREATE SCHEMA IF NOT EXISTS runtime;

CREATE TABLE IF NOT EXISTS runtime.sessions (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  flow_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- running|paused|completed|failed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION runtime.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_runtime_sessions_updated') THEN
    CREATE TRIGGER trg_runtime_sessions_updated BEFORE UPDATE ON runtime.sessions
    FOR EACH ROW EXECUTE PROCEDURE runtime.set_updated_at();
  END IF;
END $$;
