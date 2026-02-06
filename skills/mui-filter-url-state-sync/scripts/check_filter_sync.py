#!/usr/bin/env python3
from __future__ import annotations
import argparse, json
from pathlib import Path

REQUIRED_PHRASES = [
    "apply",
    "reset",
    "layer",
    "url",
    "prompt",
]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", default=".")
    p.add_argument("--report")
    args = p.parse_args()

    root = Path(args.root)
    target_docs = [root / "docs/UX_NAV_SPEC.md", root / "docs/OVERHAUL_PLAN.md"]

    errors = []
    for path in target_docs:
        if not path.exists():
            errors.append(f"Missing doc: {path}")
            continue
        text = path.read_text(encoding="utf-8").lower()
        for phrase in REQUIRED_PHRASES:
            if phrase not in text:
                errors.append(f"{path} missing phrase: {phrase}")

    report = {"error_count": len(errors), "errors": errors}
    payload = json.dumps(report, indent=2)
    print(payload)
    if args.report:
        Path(args.report).write_text(payload, encoding="utf-8")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())