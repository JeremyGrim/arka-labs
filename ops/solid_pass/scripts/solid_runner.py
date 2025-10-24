import os, sys, json, time
from pathlib import Path
from dotenv import load_dotenv
from tabulate import tabulate

from api_smoke import run_api_smoke
from db_sanity import run_db_sanity
from nomenclature_check import run_nomenclature_check
from notifications_check import run_notifications_check
from ui_health import run_ui_health

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports"
OUT.mkdir(parents=True, exist_ok=True)

# Ensure checks know where the repository root lives when the pack
# is embedded under ops/solid_pass inside the mono-repo.
if "REPO_ROOT" not in os.environ:
    os.environ["REPO_ROOT"] = str(ROOT.parent.parent)

def main():
    load_dotenv(ROOT / ".env")
    summary = {"ts": int(time.time()), "results": []}

    print("== ARKA SOLID PASS ==")
    print("1/5 API smoke...")
    api_res = run_api_smoke()
    summary["results"].append({"name": "api_smoke", **api_res})
    print("2/5 DB sanity...")
    db_res = run_db_sanity()
    summary["results"].append({"name": "db_sanity", **db_res})
    print("3/5 Nomenclature...")
    nom_res = run_nomenclature_check()
    summary["results"].append({"name": "nomenclature", **nom_res})
    print("4/5 Notifications...")
    notif_res = run_notifications_check()
    summary["results"].append({"name": "notifications", **notif_res})
    print("5/5 UI health...")
    ui_res = run_ui_health()
    summary["results"].append({"name": "ui_health", **ui_res})

    # overall
    ok_count = sum(1 for r in summary["results"] if r.get("ok"))
    fail_count = len(summary["results"]) - ok_count
    summary["ok"] = fail_count == 0

    # save JSON & MD
    (OUT / "solid_report.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    # Build MD table
    rows = []
    for r in summary["results"]:
        rows.append([r["name"], "OK" if r.get("ok") else "KO", r.get("details","")[:1200]])
    md = ["# ARKA — SOLID PASS Report", "", tabulate(rows, headers=["Check", "Status", "Details"], tablefmt="github")]
    (OUT / "solid_report.md").write_text("\n".join(md), encoding="utf-8")

    print("\n== SUMMARY ==")
    print(tabulate(rows, headers=["Check", "Status", "Details"], tablefmt="github"))
    print(f"-> report: {OUT/'solid_report.md'}")
    sys.exit(0 if summary["ok"] else 1)

if __name__ == "__main__":
    main()
