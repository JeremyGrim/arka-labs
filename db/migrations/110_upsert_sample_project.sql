DO $$
DECLARE v_client_id INT;
BEGIN
  SELECT id INTO v_client_id FROM projects.clients WHERE code='ACME';
  IF v_client_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM projects.projects WHERE key='ACME-CORE') THEN
      INSERT INTO projects.projects(client_id, key, title) VALUES (v_client_id,'ACME-CORE','ACME Core Migration');
    END IF;
  END IF;
END $$;
