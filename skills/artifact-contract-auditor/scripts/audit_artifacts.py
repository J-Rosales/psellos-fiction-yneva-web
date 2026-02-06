#!/usr/bin/env python3
"""Audit compiled artifact contracts for psellos web consumers."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def load_json(path: Path, errors: list[str]) -> Any | None:
    if not path.exists():
        errors.append(f"Missing file: {path}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"Invalid JSON in {path}: {exc}")
        return None


def require_type(value: Any, expected: type, label: str, errors: list[str]) -> bool:
    if not isinstance(value, expected):
        errors.append(f"{label} expected {expected.__name__}, got {type(value).__name__}")
        return False
    return True


def check_manifest(manifest: Any, errors: list[str]) -> None:
    if not require_type(manifest, dict, "manifest", errors):
        return
    if not isinstance(manifest.get("spec_version"), str):
        errors.append("manifest.spec_version must be a string")
    counts = manifest.get("counts")
    if not isinstance(counts, dict):
        errors.append("manifest.counts must be an object")
    else:
        if not isinstance(counts.get("persons"), (int, float)):
            errors.append("manifest.counts.persons must be a number")
        if not isinstance(counts.get("assertions"), (int, float)):
            errors.append("manifest.counts.assertions must be a number")
    if not isinstance(manifest.get("person_index"), dict):
        errors.append("manifest.person_index must be an object")


def check_persons(persons: Any, errors: list[str], warnings: list[str]) -> None:
    if not require_type(persons, dict, "persons", errors):
        return
    for key, record in persons.items():
        if not isinstance(record, dict):
            errors.append(f"persons[{key}] must be an object")
            continue
        if not isinstance(record.get("id"), str):
            errors.append(f"persons[{key}].id must be a string")
        for field in ("name", "label", "type"):
            if field in record and not isinstance(record[field], str):
                warnings.append(f"persons[{key}].{field} should be a string when present")


def check_assertion_obj(assertion: Any, label: str, errors: list[str]) -> None:
    if not isinstance(assertion, dict):
        errors.append(f"{label} must be an object")
        return
    for field in ("subject", "predicate", "object"):
        if not isinstance(assertion.get(field), str):
            errors.append(f"{label}.{field} must be a string")


def check_assertions(assertions: Any, errors: list[str]) -> None:
    if not require_type(assertions, list, "assertions", errors):
        return
    for idx, assertion in enumerate(assertions):
        check_assertion_obj(assertion, f"assertions[{idx}]", errors)


def check_assertions_by_id(assertions_by_id: Any, errors: list[str]) -> None:
    if not require_type(assertions_by_id, dict, "assertions_by_id", errors):
        return
    for assertion_id, assertion in assertions_by_id.items():
        check_assertion_obj(assertion, f"assertions_by_id[{assertion_id}]", errors)


def check_assertions_by_layer(assertions_by_layer: Any, errors: list[str]) -> None:
    if not require_type(assertions_by_layer, dict, "assertions_by_layer", errors):
        return
    for layer_id, assertion_ids in assertions_by_layer.items():
        if not isinstance(assertion_ids, list):
            errors.append(f"assertions_by_layer[{layer_id}] must be an array")
            continue
        for i, value in enumerate(assertion_ids):
            if not isinstance(value, str):
                errors.append(f"assertions_by_layer[{layer_id}][{i}] must be a string")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", default="public/data", help="Directory containing compiled artifacts")
    parser.add_argument(
        "--profile",
        choices=("m2b", "m2c"),
        default="m2c",
        help="Artifact profile to validate",
    )
    parser.add_argument("--report", help="Optional path to write JSON report")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    errors: list[str] = []
    warnings: list[str] = []

    required = {
        "m2b": ["manifest.json", "persons.json", "assertions.json"],
        "m2c": [
            "manifest.json",
            "persons.json",
            "assertions.json",
            "assertions_by_id.json",
            "assertions_by_layer.json",
        ],
    }

    loaded: dict[str, Any] = {}
    for name in required[args.profile]:
        loaded[name] = load_json(data_dir / name, errors)

    if loaded.get("manifest.json") is not None:
        check_manifest(loaded["manifest.json"], errors)
    if loaded.get("persons.json") is not None:
        check_persons(loaded["persons.json"], errors, warnings)
    if loaded.get("assertions.json") is not None:
        check_assertions(loaded["assertions.json"], errors)
    if args.profile == "m2c":
        if loaded.get("assertions_by_id.json") is not None:
            check_assertions_by_id(loaded["assertions_by_id.json"], errors)
        if loaded.get("assertions_by_layer.json") is not None:
            check_assertions_by_layer(loaded["assertions_by_layer.json"], errors)

    report = {
        "data_dir": str(data_dir),
        "profile": args.profile,
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
