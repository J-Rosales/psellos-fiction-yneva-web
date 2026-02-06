#!/usr/bin/env python3
"""Validate scale-modifier world model and basic spatial compatibility."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, help="Path to world config JSON")
    parser.add_argument("--report", help="Optional report output path")
    args = parser.parse_args()

    config = json.loads(Path(args.config).read_text(encoding="utf-8"))
    errors: list[str] = []
    warnings: list[str] = []

    world = config.get("world")
    if not isinstance(world, dict):
        errors.append("world must be an object")
        world = {}

    ref_radius = world.get("reference_radius_km")
    radius = world.get("radius_km")
    if not isinstance(ref_radius, (int, float)) or ref_radius <= 0:
        errors.append("world.reference_radius_km must be a positive number")
    if not isinstance(radius, (int, float)) or radius <= 0:
        errors.append("world.radius_km must be a positive number")

    scale_modifier = None
    if not errors:
        scale_modifier = float(radius) / float(ref_radius)
        if scale_modifier < 0.1 or scale_modifier > 10.0:
            warnings.append(f"Extreme scale modifier: {scale_modifier:.4f}")

    projection = str(config.get("projection", "geodetic")).lower()
    points = config.get("points", [])
    bounds_ok = True
    if not isinstance(points, list):
        errors.append("points must be an array")
        points = []

    if projection == "geodetic":
        for idx, point in enumerate(points):
            if not isinstance(point, dict):
                errors.append(f"points[{idx}] must be an object")
                continue
            lat = point.get("lat")
            lon = point.get("lon")
            if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
                errors.append(f"points[{idx}] lat/lon must be numeric")
                continue
            if lat < -90 or lat > 90 or lon < -180 or lon > 180:
                bounds_ok = False
                warnings.append(f"points[{idx}] is out of geodetic bounds")
    else:
        warnings.append("projection is non-geodetic; manual compatibility review required")
        bounds_ok = False

    postgis_compatible = projection == "geodetic" and bounds_ok and not errors
    result = {
        "error_count": len(errors),
        "warning_count": len(warnings),
        "scale_modifier": scale_modifier,
        "projection": projection,
        "postgis_compatible": postgis_compatible,
        "errors": errors,
        "warnings": warnings,
    }

    payload = json.dumps(result, indent=2)
    print(payload)
    if args.report:
        Path(args.report).write_text(payload, encoding="utf-8")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
