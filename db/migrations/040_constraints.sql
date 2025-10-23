-- 040_constraints.sql — contraintes & index Étape 5
-- Hypothèse : schémas & tables de l'Étape 3 déjà présents.

-- Unicité (si non déjà posée)
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname='projects' AND indexname='uq_clients_code'
  ) THEN
    CREATE UNIQUE INDEX uq_clients_code ON projects.clients(code);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname='projects' AND indexname='uq_projects_key'
  ) THEN
    CREATE UNIQUE INDEX uq_projects_key ON projects.projects(key);
  END IF;
END $$;

-- Contrainte sur les "kinds"
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'chk_participants_kind' AND connamespace = 'messages'::regnamespace
  ) THEN
    ALTER TABLE IF EXISTS messages.participants
      ADD CONSTRAINT chk_participants_kind
      CHECK (kind IN ('agent','user','system')) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'chk_messages_author_kind' AND connamespace = 'messages'::regnamespace
  ) THEN
    ALTER TABLE IF EXISTS messages.messages
      ADD CONSTRAINT chk_messages_author_kind
      CHECK (author_kind IN ('agent','user','system')) NOT VALID;
  END IF;
END $$;

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_threads_project ON messages.threads(project_id);
CREATE INDEX IF NOT EXISTS idx_participants_thread ON messages.participants(thread_id);

-- Validation des contraintes différées
ALTER TABLE messages.participants VALIDATE CONSTRAINT chk_participants_kind;
ALTER TABLE messages.messages     VALIDATE CONSTRAINT chk_messages_author_kind;
