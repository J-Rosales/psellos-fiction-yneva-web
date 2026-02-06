#!/usr/bin/env python3
from __future__ import annotations
import argparse, json
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", default=".")
    p.add_argument("--report")
    args = p.parse_args()

    root = Path(args.root)
    files = list(root.glob("src/**/*.tsx"))
    warnings = []

    for f in files:
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "IconButton" in text and "aria-label" not in text:
            warnings.append(f"{f}: IconButton without aria-label marker")
        if "Dialog" in text and "aria-" not in text:
            warnings.append(f"{f}: Dialog without explicit aria marker")

    report = {"warning_count": len(warnings), "warnings": warnings}
    payload = json.dumps(report, indent=2)
    print(payload)
    if args.report:
        Path(args.report).write_text(payload, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())