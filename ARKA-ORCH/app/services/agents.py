# app/services/agents.py
from sqlalchemy.orm import Session
from sqlalchemy import text

ROLE_HINTS = {
    "arka.business_owner": {
        "roles": ["arka.business_owner", "arka", "business_owner"],
        "agent_ids": [
            "arka-business-owner",
            "arka-agent01-arka-archivist-orchestrator",
            "arka-agent00-core-archivist",
        ],
    },
    "referent.rh": {
        "roles": ["referent.rh", "po-rh", "referent_rh"],
        "agent_ids": ["po-rh", "referent-rh"],
    },
    "referent.marketing": {
        "roles": ["referent.marketing", "po-marketing"],
        "agent_ids": ["po-marketing", "referent-marketing"],
    },
    "referent.produit": {
        "roles": ["referent.produit", "po-produit"],
        "agent_ids": ["po-produit", "referent-produit"],
    },
    "referent.tech": {
        "roles": ["referent.tech", "po-tech"],
        "agent_ids": ["po-tech", "referent-tech"],
    },
    "referent.operations": {
        "roles": ["referent.operations", "po-operations"],
        "agent_ids": ["po-operations", "referent-operations"],
    },
    "referent.conformite_donnees": {
        "roles": ["referent.conformite_donnees", "po-conformite-donnees"],
        "agent_ids": ["po-conformite-donnees", "referent-conformite-donnees"],
    },
    "referent.data_ia": {
        "roles": ["referent.data_ia", "po-data-ia"],
        "agent_ids": ["po-data-ia", "referent-data-ia"],
    },
    "referent.finance_performance": {
        "roles": ["referent.finance_performance", "po-finance-performance"],
        "agent_ids": ["po-finance-performance", "referent-finance-performance"],
    },
    "referent.developpement_commercial": {
        "roles": ["referent.developpement_commercial", "po-developpement-commercial"],
        "agent_ids": ["po-developpement-commercial", "referent-developpement-commercial"],
    },
    "referent.guard": {
        "roles": ["referent.guard", "po-guard", "referent.conformite_donnees"],
        "agent_ids": ["po-conformite-donnees"],
    },
}


def _pick_by_role(db: Session, client_code: str, role_value: str | None):
    if not role_value:
        return None
    return db.execute(
        text(
            """SELECT a.ref
               FROM projects.agent_refs a
               JOIN projects.clients c ON c.id = a.client_id
               WHERE c.code = :code AND lower(coalesce(a.role,'')) = lower(:role)
               ORDER BY a.id
               LIMIT 1"""
        ),
        {"code": client_code, "role": role_value},
    ).first()


def _pick_by_agent_id(db: Session, client_code: str, agent_id: str):
    return db.execute(
        text(
            """SELECT a.ref
               FROM projects.agent_refs a
               JOIN projects.clients c ON c.id = a.client_id
               WHERE c.code = :code AND lower(a.agent_id) = lower(:agent_id)
               ORDER BY a.id
               LIMIT 1"""
        ),
        {"code": client_code, "agent_id": agent_id},
    ).first()


def pick_agent_for_role(db: Session, client_code: str, role: str|None) -> str|None:
    if role:
        row = _pick_by_role(db, client_code, role)
        if row:
            return row.ref
        normalized = role.lower()
        hints = ROLE_HINTS.get(normalized)
        if hints:
            for hint_role in hints.get("roles", []):
                candidate = _pick_by_role(db, client_code, hint_role)
                if candidate:
                    return candidate.ref
            for agent_id in hints.get("agent_ids", []):
                candidate = _pick_by_agent_id(db, client_code, agent_id)
                if candidate:
                    return candidate.ref
    # fallback: any agent of client
    row = db.execute(text("""SELECT a.ref 
                            FROM projects.agent_refs a 
                            JOIN projects.clients c ON c.id=a.client_id 
                            WHERE c.code=:code ORDER BY a.id LIMIT 1"""), {"code": client_code}).first()
    return row.ref if row else None
