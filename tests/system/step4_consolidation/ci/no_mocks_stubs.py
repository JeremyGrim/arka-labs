#!/usr/bin/env python3
# no_mocks_stubs.py — Scan anti-mock/stub/fake/dummy + interdiction sqlite/in-memory
import os, sys, re, json
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv)>1 else Path(".")
INCLUDE = [
    "ARKA-APP/server", 
    "ARKA-APP/web",
    "ARKA-DOCKER",
]
EXCLUDE_DIRS = {".git","node_modules","dist","build","__pycache__",".venv","venv",".mypy_cache",".pytest_cache",".idea",".vscode","coverage",".cache"}
PATTERNS_BLOCK = [
    r"\bmock\b", r"\bstub\b", r"\bfake\b", r"\bdummy\b", r"\bin-?memory\b",
    r"sqlite:///?", r"sqlite3", r"TestClient\(", r"\bTODO\b", r"\bFIXME\b", r"\bHACK\b",
]
PATTERNS_ALLOW = [
    r"package\.json", r"ETAPE.*\.md", r"README", r"CHANGELOG", r"LICENSE",
    r"^#\s*Mock", r"^//\s*Mock",  # doc lines
]
EXTS = {".py",".ts",".tsx",".js",".json",".yaml",".yml",".toml",".ini",".env",".sh",".ps1",".sql",".md"}

def should_skip(path: Path) -> bool:
    parts = set(path.parts)
    if any(d in EXCLUDE_DIRS for d in parts): return True
    if path.suffix.lower() not in EXTS: return True
    return False

def main():
    findings=[]
    for inc in INCLUDE:
        base = ROOT / inc
        if not base.exists(): 
            continue
        for p in base.rglob("*"):
            if p.is_dir() or should_skip(p): 
                continue
            try:
                text = p.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for rgx in PATTERNS_BLOCK:
                for m in re.finditer(rgx, text, flags=re.I):
                    # allowlist check (line)
                    line = text[max(0,m.start()-80):m.end()+80]
                    skip=False
                    for allow in PATTERNS_ALLOW:
                        if re.search(allow, line, flags=re.I):
                            skip=True; break
                    if not skip:
                        findings.append({"file": str(p), "pattern": rgx, "line_excerpt": line.strip()})
    ok = len(findings)==0
    print(json.dumps({"ok": ok, "findings": findings}, ensure_ascii=False, indent=2))
    sys.exit(0 if ok else 1)

if __name__=="__main__":
    main()
