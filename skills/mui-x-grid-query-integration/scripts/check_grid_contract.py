#!/usr/bin/env python3
from __future__ import annotations
import argparse, json
from pathlib import Path

TOKENS = [
    "@mui/x-data-grid",
    "pagination",
    "sorting",
    "filter",
    "layer",
]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", default=".")
    p.add_argument("--report")
    args = p.parse_args()

    root = Path(args.root)
    files = list(root.glob("src/**/*.tsx")) + list(root.glob("src/**/*.ts"))
    hit_counts = {t: 0 for t in TOKENS}

    for f in files:
        text = f.read_text(encoding="utf-8", errors="ignore").lower()
        for token in TOKENS:
            if token.lower() in text:
                hit_counts[token] += 1

    report = {"token_hits": hit_counts}
    payload = json.dumps(report, indent=2)
    print(payload)
    if args.report:
        Path(args.report).write_text(payload, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())