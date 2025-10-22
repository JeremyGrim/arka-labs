# app/services/flow_loader.py
from pathlib import Path
import yaml, re
from app.utils.config import ARKA_OS_ROOT

def parse_flow_ref(flow_ref: str) -> tuple[str,str]:
    if ':' not in flow_ref:
        raise ValueError(f"flow_ref invalide: {flow_ref}")
    brick, export = flow_ref.split(':',1)
    return brick, export

def find_brick_file(brick: str) -> Path:
    root = Path(ARKA_OS_ROOT) / "FLOW"
    # heuristique: chercher dans bricks/ ou racine FLOW
    candidates = []
    for sub in ["bricks", ""]:
        d = root / sub
        if d.exists():
            for p in d.rglob("*.yaml"):
                if p.name.startswith(brick):
                    candidates.append(p)
    if not candidates:
        raise FileNotFoundError(f"brique {brick} introuvable sous ARKA_OS/FLOW")
    # priorité aux chemins sous bricks/
    candidates.sort(key=lambda p: (0 if "bricks" in p.parts else 1, len(p.as_posix())))
    return candidates[0]

def load_steps(flow_ref: str) -> list[dict]:
    brick, export = parse_flow_ref(flow_ref)
    yf = find_brick_file(brick)
    y = yaml.safe_load(yf.read_text(encoding="utf-8")) or {}
    # Schémas possibles: exports: { <name>: { steps: [...] } } OU workflows: { <name>: [...] }
    steps = None
    ex = (y.get("exports") or {}).get(export)
    if isinstance(ex, dict) and "steps" in ex:
        steps = ex["steps"]
    elif isinstance(y.get("workflows"), dict) and export in y["workflows"]:
        steps = y["workflows"][export]
    if not steps:
        raise KeyError(f"steps non trouvés pour export {export} dans {yf.name}")
    norm=[]
    for s in steps:
        if isinstance(s, dict):
            norm.append(s)
        else:
            norm.append({"name": str(s)})
    return norm
