import os
from pathlib import Path
from typing import Iterable, Tuple


def _unique_paths(paths: Iterable[Path]) -> Iterable[Path]:
    """Yield paths in order, ignoring duplicates."""
    seen: set[Path] = set()
    for path in paths:
        if path is None:
            continue
        try:
            resolved = path if isinstance(path, Path) else Path(path)
        except TypeError:
            continue
        if resolved in seen:
            continue
        seen.add(resolved)
        yield resolved


def _resolve_arka_os_root() -> Path:
    """
    Resolve the ARKA_OS root directory.

    Precedence order:
    1. Explicit ARKA_OS_ROOT env var (if points to an existing directory).
    2. Any parent of this file containing an ARKA_OS/ folder.
    3. Current working directory containing ARKA_OS/.
    4. Fallback to env var (even if missing) or ./ARKA_OS relative to backend.
    """
    env_value = os.environ.get("ARKA_OS_ROOT")
    if env_value:
        return Path(env_value).expanduser().resolve()

    here = Path(__file__).resolve()
    required_markers: Tuple[str, ...] = ("ARKA_AGENT", "ARKA_CORE")

    candidates = list(
        _unique_paths(
            [
                *(
                    parent / "ARKA_OS"
                    for parent in here.parents
                ),
                Path.cwd() / "ARKA_OS",
            ]
        )
    )

    for candidate in candidates:
        try:
            if (
                candidate
                and candidate.is_dir()
                and all((candidate / marker).exists() for marker in required_markers)
            ):
                return candidate.resolve()
        except OSError:
            continue

    fallback = (here.parent / ".." / "ARKA_OS").resolve()
    if fallback.is_dir() and all((fallback / marker).exists() for marker in required_markers):
        return fallback
    return fallback

ROUTING_URL = os.environ.get("ROUTING_URL", "http://arka-routing:8087")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+psycopg2://arka:arka@postgres:5432/arka")
ORCH_URL = os.environ.get("ORCH_URL", "http://arka-orchestrator:9092")
ORCH_API_KEY = os.environ.get("ORCH_API_KEY")
CATALOG_SOURCE = os.environ.get("CATALOG_SOURCE", "db").lower()
AGENTS_SOURCE = os.environ.get("AGENTS_SOURCE", "auto").lower()
ROUTING_SOURCE = os.environ.get("ROUTING_SOURCE", "db").lower()
SESSIONS_SOURCE = os.environ.get("SESSIONS_SOURCE", "auto").lower()
ARKA_OS_ROOT = _resolve_arka_os_root()
