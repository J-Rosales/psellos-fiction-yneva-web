# ADR-0004: Map Navigation Engine

- Status: Accepted
- Date: 2026-02-06

## Context

New requirements include geographic navigation of prosopographical elements and cross-navigation with entity and graph views.

## Decision

Adopt a map rendering engine with support for:
- Earth-like interaction conventions with scale modifier support (planet radius/diameter),
- marker overlays with place-first exploration,
- feature/vector response consumption in initial release,
- event hooks for route integration and panel drill-down.

Interaction and semantics details:
- Map is a primary discovery surface.
- Results are grouped place first, then related entities.
- Marker selection opens the same side-panel card pattern used by graph view.
- Layer filtering is hard-filter semantics.
- Unknown/ambiguous semantics are surfaced explicitly.
- Tile pipeline is not part of initial release.
- PostGIS adoption is conditional on compatibility with the scale-modifier spatial model.

## Consequences

Positive:
- Robust geospatial UX and scalable navigation patterns.
- Layer-aware map filtering aligns with overall model.
- Constructed-world compatibility is preserved while retaining familiar interaction behavior.

Tradeoff:
- Additional spatial compatibility validation is required before optional PostGIS rollout.
