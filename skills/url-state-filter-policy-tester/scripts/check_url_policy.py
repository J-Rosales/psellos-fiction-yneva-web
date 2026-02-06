#!/usr/bin/env python3
"""Check URL/filter policy consistency across docs and source files."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


DOC_REQUIREMENTS = {
    "docs/UX_NAV_SPEC.md": [
        "nearly all filter state and ui chrome state is encoded in url",
        "full reset, including `layer` reset",
        "pinning is global across routes",
        "cross-view transfer across major route types prompts",
    ],
    "docs/OVERHAUL_PLAN.md": [
        "layer is hard-filter semantics",
        "major cross-view transitions prompt before carrying filters",
        "includes `layer` reset",
    ],
}

SOURCE_HINTS = {
    "src/App.tsx": [
        "urlsearchparams",
        "history",
        "view",
    ],
    "src/views/manifest-app.ts": [
        "review",
        "layer",
        "localstorage",
    ],
}


def read_lower(path: Path) -> str:
    return path.read_text(encoding="utf-8").lower()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--report", help="Optional JSON report output path")
    args = parser.parse_args()

    root = Path(args.root)
    errors: list[str] = []
    warnings: list[str] = []

    for rel_path, patterns in DOC_REQUIREMENTS.items():
        path = root / rel_path
        if not path.exists():
            errors.append(f"Missing doc: {rel_path}")
            continue
        text = read_lower(path)
        for pattern in patterns:
            if pattern not in text:
                errors.append(f"{rel_path} missing required policy phrase: {pattern}")

    for rel_path, patterns in SOURCE_HINTS.items():
        path = root / rel_path
        if not path.exists():
            warnings.append(f"Source file missing for hint checks: {rel_path}")
            continue
        text = read_lower(path)
        for pattern in patterns:
            if pattern not in text:
                warnings.append(f"{rel_path} missing implementation hint token: {pattern}")

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
