DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects.clients WHERE code = 'ACME') THEN
    INSERT INTO projects.clients(code,name) VALUES ('ACME','ACME Industries');
  END IF;
END $$;
