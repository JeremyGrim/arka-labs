-- 076_referent_agents.sql — enregistrement des nouveaux agents ARKA/PO
INSERT INTO projects.agent_refs (client_id, agent_id, role, ref, onboarding_path)
SELECT c.id,
       v.agent_id,
       v.role,
       v.ref,
       v.onboarding_path
FROM projects.clients c
JOIN (
  VALUES
    ('arka-business-owner','arka.business_owner','clients/ACME/agents/arka-business-owner','ARKA_OS/ARKA_AGENT/clients/ACME/agents/arka-business-owner/onboarding.yaml'),
    ('po-rh','referent.rh','clients/ACME/agents/po-rh','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-rh/onboarding.yaml'),
    ('po-marketing','referent.marketing','clients/ACME/agents/po-marketing','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-marketing/onboarding.yaml'),
    ('po-produit','referent.produit','clients/ACME/agents/po-produit','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-produit/onboarding.yaml'),
    ('po-tech','referent.tech','clients/ACME/agents/po-tech','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-tech/onboarding.yaml'),
    ('po-operations','referent.operations','clients/ACME/agents/po-operations','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-operations/onboarding.yaml'),
    ('po-conformite-donnees','referent.conformite_donnees','clients/ACME/agents/po-conformite-donnees','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-conformite-donnees/onboarding.yaml'),
    ('po-data-ia','referent.data_ia','clients/ACME/agents/po-data-ia','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-data-ia/onboarding.yaml'),
    ('po-finance-performance','referent.finance_performance','clients/ACME/agents/po-finance-performance','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-finance-performance/onboarding.yaml'),
    ('po-developpement-commercial','referent.developpement_commercial','clients/ACME/agents/po-developpement-commercial','ARKA_OS/ARKA_AGENT/clients/ACME/agents/po-developpement-commercial/onboarding.yaml')
) AS v(agent_id, role, ref, onboarding_path)
ON c.code = 'ACME'
ON CONFLICT (client_id, agent_id) DO UPDATE
  SET role = EXCLUDED.role,
      ref = EXCLUDED.ref,
      onboarding_path = EXCLUDED.onboarding_path;
