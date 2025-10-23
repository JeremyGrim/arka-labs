
from __future__ import annotations

from typing import Any, List

import requests
import yaml
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import (
    ARKA_OS_ROOT,
    CATALOG_SOURCE,
    ROUTING_SOURCE,
    ROUTING_URL,
)
from app.deps.db import get_db


router = APIRouter()


def _catalog_from_db(db: Session, grep: str | None) -> List[dict]:
    base_query = """
        SELECT flow_ref, intent, name, brick, export, tags
        FROM catalog.flows
    """
    params: dict[str, Any] = {}
    if grep:
        params['pattern'] = f"%{grep}%"
        params['tag'] = grep
        base_query += (
            " WHERE flow_ref ILIKE :pattern"
            "    OR intent ILIKE :pattern"
            "    OR name ILIKE :pattern"
            "    OR brick ILIKE :pattern"
            "    OR :tag = ANY(COALESCE(tags, ARRAY[]::TEXT[]))"
        )
    base_query += " ORDER BY updated_at DESC LIMIT 200"
    rows = db.execute(text(base_query), params).mappings()
    return [dict(row) for row in rows]


def _catalog_from_fs(grep: str | None) -> List[dict]:
    bricks_dir = ARKA_OS_ROOT / 'ARKA_FLOW' / 'bricks'
    items: List[dict] = []
    if not bricks_dir.exists():
        return items
    for yaml_file in sorted(bricks_dir.glob('*.yaml')):
        try:
            payload = yaml.safe_load(yaml_file.read_text(encoding='utf-8')) or {}
        except Exception:  # pragma: no cover - best effort
            continue
        brick = payload.get('id') or yaml_file.stem
        flows = payload.get('flows') or payload.get('workflows') or {}
        for export_name, data in flows.items():
            name = data.get('title') or data.get('name') or export_name
            item = {
                'flow_ref': f'{brick}:{export_name}',
                'intent': data.get('intent'),
                'name': name,
                'brick': brick,
                'export': export_name,
                'tags': data.get('tags'),
            }
            items.append(item)
    if grep:
        needle = grep.lower()
        items = [
            item
            for item in items
            if any(
                needle in (str(value).lower())
                for value in (item.get('flow_ref'), item.get('intent'), item.get('name'))
                if value
            )
        ]
    return items[:200]


def _catalog_from_proxy(grep: str | None) -> dict:
    resp = requests.get(
        f"{ROUTING_URL}/catalog",
        params={'facet': 'flow', 'grep': grep},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def _resolve_from_db(db: Session, intent: str | None, term: str | None) -> List[dict]:
    if intent:
        row = db.execute(
            text(
                """
                SELECT i.intent, i.flow_ref, f.name, f.tags
                FROM routing.intents i
                JOIN catalog.flows f ON f.flow_ref = i.flow_ref
                WHERE i.intent = :intent
                LIMIT 1
                """
            ),
            {"intent": intent},
        ).mappings().first()
        if row:
            return [dict(row)]
    pattern = None
    params: dict[str, Any] = {}
    if term:
        pattern = f"%{term}%"
        params['pattern'] = pattern
        params['term'] = term
    query = (
        """
        SELECT i.intent, i.flow_ref, f.name, f.tags
        FROM routing.intents i
        JOIN catalog.flows f ON f.flow_ref = i.flow_ref
        """
    )
    if pattern:
        query += (
            " WHERE i.intent ILIKE :pattern"
            "    OR f.name ILIKE :pattern"
            "    OR :term = ANY(COALESCE(f.tags, ARRAY[]::TEXT[]))"
        )
    query += " ORDER BY i.weight DESC, f.updated_at DESC LIMIT 50"
    rows = db.execute(text(query), params).mappings()
    return [dict(row) for row in rows]


def _resolve_from_proxy(intent: str | None, term: str | None, client: str | None) -> dict:
    resp = requests.get(
        f"{ROUTING_URL}/resolve",
        params={'intent': intent, 'term': term, 'client': client},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def _lookup_from_db(db: Session, term: str | None) -> List[dict]:
    if not term:
        return []
    pattern = f"%{term}%"
    rows = db.execute(
        text(
            """
            SELECT flow_ref, intent, name, brick, export, tags
            FROM catalog.flows
            WHERE flow_ref ILIKE :pattern
               OR intent ILIKE :pattern
               OR name ILIKE :pattern
            ORDER BY updated_at DESC
            LIMIT 50
            """
        ),
        {"pattern": pattern},
    ).mappings()
    return [dict(row) for row in rows]


@router.get('/catalog')
def catalog(
    facet: str = Query('flow'),
    grep: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    if facet not in ('flow', 'flows', None):
        return {'items': [], 'error': f'facet {facet} non supporté'}
    source = CATALOG_SOURCE
    if source in ('db', 'auto'):
        try:
            items = _catalog_from_db(db, grep)
            if items or source == 'db':
                payload = {'items': items, 'source': 'db'}
                return payload
        except Exception as exc:  # pragma: no cover
            if source == 'db':
                raise HTTPException(status_code=500, detail=f'catalog DB error: {exc}')
    if source in ('fs', 'auto'):
        try:
            items = _catalog_from_fs(grep)
            if items or source == 'fs':
                payload = {'items': items, 'source': 'fs'}
                if source == 'auto':
                    payload['fallback'] = 'fs'
                return payload
        except Exception as exc:  # pragma: no cover
            if source == 'fs':
                raise HTTPException(status_code=500, detail=f'catalog FS error: {exc}')
    if source == 'auto':
        try:
            data = _catalog_from_proxy(grep)
            data['source'] = 'proxy'
            data['fallback'] = 'proxy'
            return data
        except Exception:  # pragma: no cover
            pass
    raise HTTPException(status_code=404, detail='catalog: aucune donnée disponible')


@router.get('/lookup')
def lookup(
    term: str = Query('', description='terme de recherche'),
    db: Session = Depends(get_db),
) -> dict:
    if CATALOG_SOURCE in ('db', 'auto'):
        try:
            return {'items': _lookup_from_db(db, term), 'source': 'db'}
        except Exception:  # pragma: no cover
            if CATALOG_SOURCE == 'db':
                raise
    try:
        resp = requests.get(f"{ROUTING_URL}/lookup", params={'term': term}, timeout=10)
        resp.raise_for_status()
        payload = resp.json()
        payload['source'] = 'proxy'
        return payload
    except Exception as exc:  # pragma: no cover
        return {'items': [], 'fallback': True, 'error': str(exc)}


@router.get('/resolve')
def resolve(
    intent: str | None = None,
    term: str | None = None,
    client: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    source = ROUTING_SOURCE
    if source in ('db', 'auto'):
        try:
            items = _resolve_from_db(db, intent, term)
            if items or source == 'db':
                payload = {'items': items, 'source': 'db'}
                return payload
        except Exception as exc:  # pragma: no cover
            if source == 'db':
                raise HTTPException(status_code=500, detail=f'resolve DB error: {exc}')
    if source == 'auto':
        try:
            data = _resolve_from_proxy(intent, term, client)
            data['source'] = 'proxy'
            data['fallback'] = 'proxy'
            return data
        except Exception as exc:  # pragma: no cover
            return {'items': [], 'fallback': True, 'error': str(exc)}
    return {'items': [], 'fallback': True, 'error': 'No routing data'}
