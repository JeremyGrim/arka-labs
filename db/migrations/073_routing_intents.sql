-- 073_routing_intents.sql — table routing.intents (intent -> flow_ref)
CREATE TABLE IF NOT EXISTS routing.intents (
  intent     TEXT PRIMARY KEY,
  flow_ref   TEXT NOT NULL REFERENCES catalog.flows(flow_ref) ON UPDATE CASCADE ON DELETE CASCADE,
  weight     INT DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_intents_flow_ref ON routing.intents(flow_ref);
