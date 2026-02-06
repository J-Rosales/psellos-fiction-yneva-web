#!/usr/bin/env python3
"""Scaffold read-only API endpoint modules from templates."""

from __future__ import annotations

import argparse
from pathlib import Path


DEFAULT_RESOURCES = [
    "entities",
    "entityById",
    "assertions",
    "graphNeighborhood",
    "mapFeatures",
    "layers",
    "layerChangelog",
]


def pascal_case(name: str) -> str:
    parts = []
    token = ""
    for ch in name:
        if ch.isalnum():
            token += ch
        else:
            if token:
                parts.append(token)
                token = ""
    if token:
        parts.append(token)
    return "".join(part[:1].upper() + part[1:] for part in parts if part)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-dir", required=True, help="Output directory for generated API files")
    parser.add_argument(
        "--resources",
        default=",".join(DEFAULT_RESOURCES),
        help="Comma-separated list of resource names",
    )
    parser.add_argument(
        "--assets-dir",
        default="skills/read-only-api-scaffold/assets",
        help="Template assets directory",
    )
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    assets_dir = Path(args.assets_dir)

    endpoint_template = (assets_dir / "endpoint.template.ts").read_text(encoding="utf-8")
    error_template = (assets_dir / "error.template.ts").read_text(encoding="utf-8")
    routes_template = (assets_dir / "routes.template.ts").read_text(encoding="utf-8")

    (out_dir / "error.ts").write_text(error_template, encoding="utf-8")

    resources = [x.strip() for x in args.resources.split(",") if x.strip()]
    export_lines = []
    for resource in resources:
        pascal = pascal_case(resource)
        filename = f"{resource}.ts"
        body = endpoint_template.replace("{{RESOURCE_PASCAL}}", pascal)
        (out_dir / filename).write_text(body, encoding="utf-8")
        export_lines.append(f'export * from "./{resource}";')

    routes_body = routes_template.replace("{{EXPORTS}}", "\n".join(export_lines) + "\n")
    (out_dir / "routes.ts").write_text(routes_body, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
