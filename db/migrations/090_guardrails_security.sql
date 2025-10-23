-- 090_guardrails_security.sql — quotas & API keys
CREATE SCHEMA IF NOT EXISTS runtime;

-- API keys simples (RBAC minimal)
CREATE TABLE IF NOT EXISTS runtime.api_keys (
  api_key TEXT PRIMARY KEY,
  label TEXT,
  scopes TEXT[] DEFAULT ARRAY['run','orch','ui']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quotas par session Runner
ALTER TABLE IF EXISTS runtime.sessions
  ADD COLUMN IF NOT EXISTS quota_tokens BIGINT,
  ADD COLUMN IF NOT EXISTS spent_tokens BIGINT DEFAULT 0;

-- Quotas Orchestrator (par session)
ALTER TABLE IF EXISTS runtime.orch_sessions
  ADD COLUMN IF NOT EXISTS quota_tokens BIGINT,
  ADD COLUMN IF NOT EXISTS spent_tokens BIGINT DEFAULT 0;
