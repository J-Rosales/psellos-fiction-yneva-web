# Spec to ADR Sync Map

## Documents in Scope

- `docs/OVERHAUL_PLAN.md`
- `docs/DATA_QUERY_SPEC.md`
- `docs/UX_NAV_SPEC.md`
- `docs/ADR/ADR-0001-stack-and-platform.md`
- `docs/ADR/ADR-0002-read-only-index-db.md`
- `docs/ADR/ADR-0003-graph-navigation-engine.md`
- `docs/ADR/ADR-0004-map-navigation-engine.md`

## Policy Anchors

These statements should stay aligned:

- Layer filtering is hard-filter semantics.
- Search defaults to fuzzy with global exact toggle.
- Map is place-first and graph/map use side-panel consistency.
- API is resource-oriented, frontend-internal first, unversioned until first break.
- PostgreSQL baseline with optional PostGIS compatibility checks.

## Recommended Update Order

1. Update `OVERHAUL_PLAN.md`.
2. Update `DATA_QUERY_SPEC.md` and `UX_NAV_SPEC.md`.
3. Update ADRs to reflect exact same decisions.
4. Re-run sync check.
