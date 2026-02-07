# Graph Epic Release Report

Date: 2026-02-07
Scope: `docs/EPIC-GRAPH-VIEW-MODES-AND-ANALYTICS.md`

## Delivered

- Structure mode toggle (`Node View` / `Hierarchical View`) with stable side-panel behavior.
- Persistent Cytoscape instance; node click focuses/pans without full remount.
- Node-view spacing and readability tuning with zoom-aware label behavior.
- Hierarchical layout baseline with rectangular nodes and hierarchy connector style.
- Topology-driven expansion model using depth and selected-seed context.
- Node-view analysis controls:
  - relation include/exclude chips,
  - confidence-based visual encoding,
  - ambiguity edge signaling,
  - relation/source details in side panel,
  - time slicing.
- Hierarchical exploration controls:
  - set selected as root,
  - collapse branch,
  - generation-level labeling.
- Styling system baseline:
  - semantic node mapping (entity type color/shape),
  - semantic edge mapping (relation color/line style),
  - halo/border semantic channel,
  - reset-to-preset behavior.
- Utility features:
  - jump-to-node focus,
  - path highlighting,
  - PNG/SVG snapshot export,
  - filtered subgraph JSON export.

## Verification Summary

- `npm run build`: pass
- `npm run test:unit`: pass
- `npm run check:spec-adr-sync`: pass (0 errors)
- `npm run check:url-policy`: pass (0 errors, 2 warnings)
- `npm run check:artifact-contract`: pass (0 errors)

## Known Remaining Blockers

- `npm run test:e2e` remains unstable in local environment due intermittent test webserver refusal (`ERR_CONNECTION_REFUSED`), independent of graph assertion logic.
- Blocked by epic policy decisions:
  - advanced hierarchical relation lanes taxonomy,
  - optional next-hop prefetch policy.
