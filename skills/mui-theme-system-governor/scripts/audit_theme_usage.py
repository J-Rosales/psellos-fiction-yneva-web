#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re
from pathlib import Path

HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", default=".")
    p.add_argument("--report")
    args = p.parse_args()

    root = Path(args.root)
    files = list(root.glob("src/**/*.tsx")) + list(root.glob("src/**/*.ts"))
    findings = []
    for f in files:
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "node_modules" in str(f):
            continue
        for i, line in enumerate(text.splitlines(), start=1):
            if HEX_RE.search(line):
                findings.append(f"{f}:{i} contains raw color token")

    report = {
        "finding_count": len(findings),
        "findings": findings,
    }
    payload = json.dumps(report, indent=2)
    print(payload)
    if args.report:
        Path(args.report).write_text(payload, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())