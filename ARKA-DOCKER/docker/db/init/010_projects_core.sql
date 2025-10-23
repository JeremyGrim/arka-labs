-- Projects core tables
CREATE TABLE IF NOT EXISTS projects.clients (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects.projects (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES projects.clients(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects.project_profiles (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects.projects(client_id);
