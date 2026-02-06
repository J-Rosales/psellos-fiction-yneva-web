#!/usr/bin/env python3
"""Infer weighted graph cluster memberships from assertions."""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


MODE_TOKENS = {
    "dynasty": [
        "parent",
        "child",
        "sibling",
        "spouse",
        "dynasty",
        "house",
        "lineage",
        "ancestor",
        "descendant",
    ],
    "workplace": [
        "works_at",
        "served_at",
        "employed",
        "appointed",
        "office",
        "institution",
        "court",
        "guild",
        "stationed",
    ],
}


def load_assertions(path: Path) -> list[dict[str, Any]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return [x for x in raw if isinstance(x, dict)]
    if isinstance(raw, dict):
        out: list[dict[str, Any]] = []
        for assertion_id, record in raw.items():
            if not isinstance(record, dict):
                continue
            item = dict(record)
            item.setdefault("id", assertion_id)
            out.append(item)
        return out
    raise ValueError(f"Unsupported assertion file structure in {path}")


def extract_relation_type(assertion: dict[str, Any]) -> str:
    direct = assertion.get("rel_type")
    if isinstance(direct, str):
        return direct.lower()
    ext = assertion.get("extensions")
    if isinstance(ext, dict):
        psellos = ext.get("psellos")
        if isinstance(psellos, dict):
            rel = psellos.get("rel")
            if isinstance(rel, str):
                return rel.lower()
    raw = assertion.get("raw")
    if isinstance(raw, dict):
        rel = raw.get("rel_type")
        if isinstance(rel, str):
            return rel.lower()
    return ""


def score_mode(predicate: str, rel_type: str, mode: str) -> int:
    score = 0
    for token in MODE_TOKENS[mode]:
        if token in predicate:
            score += 2
        if token and token in rel_type:
            score += 3
        if token == mode and token in predicate:
            score += 4
    return score


def normalize_entity_id(assertion: dict[str, Any], key: str) -> str | None:
    value = assertion.get(key)
    if isinstance(value, str):
        return value
    alt = assertion.get(f"{key}Id")
    if isinstance(alt, str):
        return alt
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assertions", required=True, help="Path to assertions JSON file")
    parser.add_argument(
        "--mode",
        choices=("all", "dynasty", "workplace"),
        default="all",
        help="Mode to compute",
    )
    parser.add_argument("--threshold", type=int, default=1, help="Minimum score to include membership")
    parser.add_argument("--output", help="Optional output file path")
    args = parser.parse_args()

    assertions = load_assertions(Path(args.assertions))
    modes = ["dynasty", "workplace"] if args.mode == "all" else [args.mode]

    scores: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    evidence: list[dict[str, Any]] = []

    for assertion in assertions:
        subject = normalize_entity_id(assertion, "subject")
        obj = normalize_entity_id(assertion, "object")
        if not subject or not obj:
            continue
        predicate = str(assertion.get("predicate", "")).lower()
        rel_type = extract_relation_type(assertion)
        assertion_id = str(assertion.get("id", ""))

        for mode in modes:
            delta = score_mode(predicate, rel_type, mode)
            if delta <= 0:
                continue
            scores[subject][mode] += delta
            scores[obj][mode] += delta
            evidence.append(
                {
                    "assertion_id": assertion_id,
                    "mode": mode,
                    "subject": subject,
                    "object": obj,
                    "delta": delta,
                }
            )

    memberships = []
    for entity_id, mode_map in sorted(scores.items()):
        for mode, score in sorted(mode_map.items()):
            if score >= args.threshold:
                memberships.append({"entity_id": entity_id, "mode": mode, "score": score})

    result = {
        "mode": args.mode,
        "threshold": args.threshold,
        "membership_count": len(memberships),
        "memberships": memberships,
        "evidence": evidence,
    }

    payload = json.dumps(result, indent=2)
    print(payload)
    if args.output:
        Path(args.output).write_text(payload, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
