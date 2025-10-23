-- 050_defaults.sql — colonnes par défauts/horodatage (optionnelles)
-- Ajoute updated_at et triggers basiques si souhaité (sans casser l'existant).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='projects' AND table_name='projects' AND column_name='updated_at'
  ) THEN
    ALTER TABLE projects.projects ADD COLUMN updated_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='trg_projects_updated_at'
  ) THEN
    CREATE TRIGGER trg_projects_updated_at
      BEFORE UPDATE ON projects.projects
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END $$;
