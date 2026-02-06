#!/usr/bin/env python3
"""Check consistency across plan/spec/ADR documents."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REQUIRED_PATTERNS = {
    "docs/OVERHAUL_PLAN.md": [
        "layer is hard-filter semantics",
        "resource-oriented http",
        "postgresql",
        "postgis adoption is conditional",
        "place-first",
    ],
    "docs/DATA_QUERY_SPEC.md": [
        "layer filtering is hard-filter semantics",
        "default mode: fuzzy search",
        "exact mode: global toggle",
        "resource-oriented http",
        "database: postgresql",
    ],
    "docs/UX_NAV_SPEC.md": [
        "fuzzy (default)",
        "cross-view transfer across major route types prompts",
        "full reset, including `layer` reset",
        "place-first",
        "node click opens a side-panel card",
    ],
    "docs/ADR/ADR-0001-stack-and-platform.md": ["status: accepted"],
    "docs/ADR/ADR-0002-read-only-index-db.md": ["status: accepted"],
    "docs/ADR/ADR-0003-graph-navigation-engine.md": ["status: accepted"],
    "docs/ADR/ADR-0004-map-navigation-engine.md": ["status: accepted"],
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--report", help="Optional path to write JSON report")
    args = parser.parse_args()

    root = Path(args.root)
    errors: list[str] = []
    warnings: list[str] = []

    for rel_path, patterns in REQUIRED_PATTERNS.items():
        path = root / rel_path
        if not path.exists():
            errors.append(f"Missing required document: {rel_path}")
            continue
        text = path.read_text(encoding="utf-8").lower()
        for pattern in patterns:
            if pattern not in text:
                errors.append(f"{rel_path} missing required phrase: {pattern}")

    data_spec = (root / "docs/DATA_QUERY_SPEC.md").read_text(encoding="utf-8").lower()
    ux_spec = (root / "docs/UX_NAV_SPEC.md").read_text(encoding="utf-8").lower()
    if "unknown/ambiguous" not in data_spec and "unknown/ambiguous" in ux_spec:
        warnings.append("UX references unknown/ambiguous buckets but data spec does not mention them.")

    report = {
        "error_count": len(errors),
        "warning_count": len(warnings),
        "errors": errors,
        "warnings": warnings,
    }
    print(json.dumps(report, indent=2))

    if args.report:
        Path(args.report).write_text(json.dumps(report, indent=2), encoding="utf-8")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
