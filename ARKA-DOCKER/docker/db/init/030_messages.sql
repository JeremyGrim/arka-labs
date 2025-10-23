-- Messaging
CREATE TABLE IF NOT EXISTS messages.threads (
  id BIGSERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages.participants (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES messages.threads(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- agent|user|system
  ref TEXT,          -- e.g. clients/<ID>/agents/<agent_id>
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages.messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES messages.threads(id) ON DELETE CASCADE,
  author_kind TEXT NOT NULL, -- agent|user|system
  author_ref TEXT,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_content_gin ON messages.messages USING GIN(content);
