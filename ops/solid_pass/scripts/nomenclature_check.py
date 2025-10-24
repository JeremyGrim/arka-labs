import os, re
from pathlib import Path
from dotenv import load_dotenv

def run_nomenclature_check():
    load_dotenv()
    root = Path(os.environ.get("REPO_ROOT") or ".").resolve()
    issues = []

    # 1) Required modules exist
    required = [
        "ARKA_OS/ARKA_CORE",
        "ARKA_OS/ARKA_FLOW",
        "ARKA_OS/ARKA_ROUTING",
        "ARKA_OS/ARKA_PROFIL",
        "ARKA-APP/web",
    ]
    for rel in required:
        if not (root / rel).exists():
            issues.append(f"Missing required path: {rel}")

    # 2) No LOT_* at repo root (should be archived)
    for p in root.iterdir():
        if p.is_dir() and re.match(r"(?i)LOT_.*", p.name):
            issues.append(f"Dossier temporaire à la racine: {p.name}")

    # 3) FLOW bricks naming
    flow_dir = root / "ARKA_OS/ARKA_FLOW/bricks"
    if flow_dir.exists():
        bad = [p.name for p in flow_dir.glob("*") if p.is_file() and not re.match(r"ARKFLOW-[A-Z0-9-]+\.ya?ml$", p.name)]
        if bad:
            issues.append(f"Fichiers FLOW non conformes: {', '.join(bad)}")

    # 4) ROUTING bricks naming
    routing_dir = root / "ARKA_OS/ARKA_ROUTING/bricks"
    if routing_dir.exists():
        bad = [p.name for p in routing_dir.glob("*") if p.is_file() and not re.match(r"ARKAROUTING-[0-9A-Z-]+\.ya?ml$", p.name)]
        if bad:
            issues.append(f"Fichiers ROUTING non conformes: {', '.join(bad)}")

    # 5) CORE bricks presence minimal
    core_dir = root / "ARKA_OS/ARKA_CORE/bricks"
    required_core = ["ARKORE01-HIERARCHY.yaml","ARKORE02-GLOBAL-RULES.yaml","ARKORE08-PATHS-GOVERNANCE.yaml"]
    missing_core = [name for name in required_core if not (core_dir / name).exists()]
    if missing_core:
        issues.append(f"CORE bricks manquants: {', '.join(missing_core)}")

    # 6) UI location uniqueness
    allowed_frontend = (root / "ARKA-APP" / "web").resolve()
    dup_frontends = []

    def _should_skip(path: Path) -> bool:
        parts = {part.lower() for part in path.parts}
        return (
            any(part.startswith(".venv") for part in parts)
            or ".git" in parts
            or "node_modules" in parts
            or ".project-docs" in parts
        )

    for dirpath, dirnames, filenames in os.walk(root, topdown=True, onerror=lambda e: None):
        current = Path(dirpath)
        if _should_skip(current):
            dirnames[:] = []
            continue
        if "frontend" in dirnames:
            candidate = current / "frontend"
            package_file = candidate / "package.json"
            try:
                if package_file.exists() and candidate.resolve() != allowed_frontend:
                    dup_frontends.append(str(candidate.relative_to(root)))
            except OSError:
                continue
    if dup_frontends:
        issues.append("Frontends dispersés détectés (déplacer vers ARKA_APP/web)")

    ok = len(issues) == 0
    details = "OK nomenclature" if ok else "; ".join(issues)
    return {"ok": ok, "details": details}

if __name__ == "__main__":
    print(run_nomenclature_check())
