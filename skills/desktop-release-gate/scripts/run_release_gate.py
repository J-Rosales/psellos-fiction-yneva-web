#!/usr/bin/env python3
"""Run desktop release readiness checks."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


DOCS_REQUIRED = [
    "docs/OVERHAUL_PLAN.md",
    "docs/DATA_QUERY_SPEC.md",
    "docs/UX_NAV_SPEC.md",
    "docs/ADR/ADR-0001-stack-and-platform.md",
    "docs/ADR/ADR-0002-read-only-index-db.md",
    "docs/ADR/ADR-0003-graph-navigation-engine.md",
    "docs/ADR/ADR-0004-map-navigation-engine.md",
]


def read_lower(path: Path) -> str:
    return path.read_text(encoding="utf-8").lower()


def run_build(root: Path) -> tuple[bool, str]:
    cmd = ["npm", "run", "build"]
    proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True, check=False)
    output = (proc.stdout or "") + (proc.stderr or "")
    return (proc.returncode == 0, output[-4000:])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--run-build", action="store_true", help="Run npm build as part of gate")
    parser.add_argument("--report", help="Optional report path")
    args = parser.parse_args()

    root = Path(args.root)
    failures: list[str] = []
    warnings: list[str] = []

    for rel in DOCS_REQUIRED:
        path = root / rel
        if not path.exists():
            failures.append(f"Missing required doc: {rel}")

    for rel in DOCS_REQUIRED[-4:]:
        path = root / rel
        if path.exists() and "status: accepted" not in read_lower(path):
            failures.append(f"ADR not accepted: {rel}")

    ux_path = root / "docs/UX_NAV_SPEC.md"
    data_path = root / "docs/DATA_QUERY_SPEC.md"
    if ux_path.exists() and "full reset, including `layer` reset" not in read_lower(ux_path):
        failures.append("UX spec missing full reset policy")
    if data_path.exists() and "layer filtering is hard-filter semantics" not in read_lower(data_path):
        failures.append("Data spec missing hard-filter policy")

    build_ok = None
    build_tail = ""
    if args.run_build:
        build_ok, build_tail = run_build(root)
        if not build_ok:
            failures.append("npm run build failed")
    else:
        warnings.append("Build check skipped (use --run-build for release gate).")

    report = {
        "failure_count": len(failures),
        "warning_count": len(warnings),
        "failures": failures,
        "warnings": warnings,
        "build_ok": build_ok,
        "build_output_tail": build_tail,
    }

    payload = json.dumps(report, indent=2)
    print(payload)
    if args.report:
        Path(args.report).write_text(payload, encoding="utf-8")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
