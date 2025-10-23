-- Project memory (JSONB)
CREATE TABLE IF NOT EXISTS memory.memories (
  id BIGSERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
  scope TEXT NOT NULL, -- agent|flow|doc|global
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_project ON memory.memories(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_scope ON memory.memories(scope);
CREATE INDEX IF NOT EXISTS idx_memory_payload_gin ON memory.memories USING GIN(payload);
