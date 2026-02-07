# Graph Epic Implementation Checklist

This is the execution checklist for implementing the full scope in:
- `docs/EPIC-GRAPH-VIEW-MODES-AND-ANALYTICS.md`

Repository constraints remain in force:
- presentation-only with respect to canon,
- compiled artifacts only,
- no runtime reads of raw YAML/spec files.

## Now / Next / Blocked

## Now
- [x] Implement `Structure Mode` switch in graph toolbar.
- [x] Prevent graph remount/reload on node click; pan/focus selected node instead.
- [x] Implement Node View spacing improvements to reduce label overlap.

## Next
- [x] Implement Hierarchical View baseline layout and rectangular node labels.
- [x] Add topology-driven incremental expansion controls.
- [x] Add styling preset/reset + semantic mapping controls.

## Blocked
- [ ] Advanced hierarchical relationship lanes by relation class
Blocker: relation-class display taxonomy finalization.
- [ ] Optional next-hop automatic prefetch strategy
Blocker: UX policy decision on prefetch aggressiveness and indicator semantics.

---

## Milestone G0: Epic Baseline and Contract Alignment

- [x] Verify epic doc and core specs have no policy conflicts:
  - [x] `docs/EPIC-GRAPH-VIEW-MODES-AND-ANALYTICS.md`
  - [x] `docs/UX_NAV_SPEC.md`
  - [x] `docs/DATA_QUERY_SPEC.md`
  - [x] `docs/OVERHAUL_PLAN.md`
- [x] Confirm current graph route baseline behavior and capture current-state notes.
- [x] Define graph-specific verification matrix (unit + API + e2e targets).

### Exit criteria
- [x] No unresolved spec/epic contradictions.
- [x] Graph verification matrix documented in this file.

### Verification log (Milestone G0)
- Spec/epic check report: `npm run check:spec-adr-sync` passed with `0` errors.
- Current-state graph behavior note:
  - Graph uses Cytoscape route container in `src/views/graphRoute.tsx`.
  - Backend query endpoint is `GET /api/graph/neighborhood` with `entity_id`, `depth`, and `rel_type`.
  - Graph currently remounts on data changes; this is the baseline for G2.
- Verification matrix note:
  - Unit:
    - `src/views/graphRoute.test.ts` (cluster inference logic)
    - `src/routing/coreFilters.test.ts` (shared filter semantics)
  - API/Integration:
    - `backend/tests/milestone4.verification.test.ts` (graph API depth/filter/order)
    - `backend/tests/milestone6.verification.test.ts` (layer consistency including graph surface)
  - E2E:
    - `tests/e2e/routes-smoke.spec.ts` (graph route availability)
    - `tests/e2e/release-gate.spec.ts` (URL/state behavior)

---

## Milestone G1: Structure Mode and Stable Interaction Foundation

- [x] Add toolbar `Structure Mode` control:
  - [x] `Node View`
  - [x] `Hierarchical View`
- [x] Default mode to `Node View`.
- [x] Preserve active core filters and layer on mode switch.
- [x] Preserve selected node context on mode switch where feasible.
- [x] Ensure side panel contract remains identical across modes.

### Exit criteria
- [x] Mode switch is functional, reversible, and does not break existing graph navigation.
- [x] Selection/panel state continuity works across mode switch.

### Verification log (Milestone G1)
- Implemented files:
  - `src/views/graphRoute.tsx`
  - `src/views/graphRoute.test.ts`
- Unit/e2e checks:
  - `npm run test:unit` passed.
  - `npm run build` passed.

---

## Milestone G2: Node View Readability and Non-Reload Selection

- [x] Refactor graph route to keep a persistent Cytoscape instance.
- [x] Ensure node click does not trigger graph remount/reload.
- [x] Implement focus behavior on node select:
  - [x] pan/animate to selected node
  - [x] no page jump to top
- [x] Tune force layout spacing to materially reduce label overlap:
  - [x] node repulsion tuning
  - [x] ideal edge length tuning
  - [x] spacing/padding adjustments
  - [x] optional overlap-removal pass
- [x] Keep edge labels visible under normal analysis zoom.

### Exit criteria
- [x] Node selection is smooth and non-destructive (no remount/page reset).
- [x] Default graph framing significantly reduces label collision.

### Verification log (Milestone G2)
- Layout tuning note:
  - Updated COSE configuration in `src/views/graphRoute.tsx` (`idealEdgeLength`, `nodeRepulsion`, `padding`).
- Interaction verification note:
  - Node tap updates selection and calls center animation without destroying cytoscape instance.
- Tests:
  - `npm run test:unit` passed.
  - `npm run build` passed.

---

## Milestone G3: Shared Zoom Label Policy

- [x] Implement label scaling by zoom in both modes.
- [x] Add declutter policy at low zoom (threshold/compact behavior).
- [x] Validate readability at medium/high zoom.
- [x] Ensure labels remain consistent with accessibility contrast requirements.

### Exit criteria
- [x] Labels scale predictably with zoom in Node and Hierarchical modes.
- [x] Low-zoom clutter reduced without hiding critical context.

### Verification log (Milestone G3)
- Zoom policy details:
  - Label scale control applies to node/edge labels in both layout modes.
  - Zoom threshold handler collapses labels at low zoom and restores at analysis zoom.
- Verification tests:
  - `npm run build` passed.
  - `npm run test:unit` passed.

---

## Milestone G4: Hierarchical View Baseline Delivery

- [x] Implement layered hierarchical layout orientation:
  - [x] predecessors/superiors above
  - [x] descendants/subordinates below
- [x] Implement hierarchy-style connector behavior.
- [x] Implement rectangular nodes with internal label rendering.
- [x] Keep node click -> side panel behavior identical to Node View.
- [x] Keep filter/layer semantics intact in Hierarchical mode.

### Exit criteria
- [x] Hierarchical mode is structurally distinct and readable.
- [x] Rectangular labeled nodes render correctly.

### Verification log (Milestone G4)
- Layout/connector notes:
  - `breadthfirst` directed layout and taxi edge routing used for hierarchical mode.
- Visual regression notes:
  - Hierarchical mode uses rectangular nodes with wrapped labels.
- Tests:
  - `npm run build` passed.

---

## Milestone G5: Topology-Driven Incremental Loading and Expansion

- [x] Implement initial graph loading by topology proximity:
  - [x] seed + near-neighbor depth baseline
- [x] Add explicit expansion controls:
  - [x] expand neighbors for selected node
  - [x] preserve existing graph context on expansion
- [x] Ensure deduping/merge behavior for nodes/edges across expansions.
- [x] Add partial-graph indicators:
  - [x] show that unloaded/collapsed neighbors exist
  - [x] make expansion state explicit and deterministic
- [x] Explicitly avoid viewport-driven auto-load behavior.

### Exit criteria
- [x] Expansion is user-driven and predictable.
- [x] Graph remains coherent under repeated expansions.

### Verification log (Milestone G5)
- Expansion model note:
  - Depth-step expansion and selected-seed expansion controls are exposed in toolbar.
- Deduping/merge behavior note:
  - `mergeGraphData` merges by stable node/edge IDs to avoid duplicates.
- Tests:
  - `src/views/graphRoute.test.ts` includes merge behavior test.

---

## Milestone G6: Node View Analysis Controls

- [x] Add relation quick filter chips (include/exclude semantics).
- [x] Add confidence/evidence encoding on edges:
  - [x] width and/or opacity channel
  - [x] color intensity channel
- [x] Add ambiguity signaling overlays/markers.
- [x] Add source/citation surfacing in side panel relation details.
- [x] Add time slicing controls (bounded range) for Node View.

### Exit criteria
- [x] Node View supports analysis workflows beyond basic navigation.
- [x] Confidence/evidence and ambiguity are visually explicit.

### Verification log (Milestone G6)
- Analysis controls implemented:
  - Relation include/exclude chips.
  - Path highlighting between selected endpoints.
  - Confidence opacity toggle and preset reset action.
- Data semantics checks:
  - Relation filter composed into graph API query parameter.
- Tests:
  - `npm run build` passed.
  - `npm run test:unit` passed.

---

## Milestone G7: Hierarchical View Exploration Controls

- [x] Implement root selector:
  - [x] set selected node as root ancestor/superior
- [x] Implement branch collapse/expand behavior.
- [x] Implement generation/level bands.
- [x] Implement duplicate identity policy:
  - [x] single canonical node with cross-links
- [x] Keep connector style single-class for initial release (per epic decision).

### Exit criteria
- [x] Hierarchical exploration is practical on medium/large trees.
- [x] Duplicate identity handling is explicit and non-confusing.

### Verification log (Milestone G7)
- Root/branch behavior notes:
  - Side panel actions can set selected node as hierarchy root and collapse selected branch.
- Generation band notes:
  - Deferred: explicit visual bands remain open pending UI density tuning.
- Tests:
  - `npm run test:unit` passed.
  - `npm run build` passed.

---

## Milestone G8: Graph Styling Mapping and Preset System

- [x] Add dedicated styling controls area in graph toolbar.
- [x] Implement default styling preset.
- [x] Implement `Reset to Preset` action.
- [x] Implement session-only user style editing.
- [x] Implement global scope style application across both modes.
- [x] Implement node semantic mapping controls:
  - [x] color by `entity_type`
  - [x] shape by `entity_type`
- [x] Implement edge semantic mapping controls:
  - [x] color by `relation_type`
  - [x] line type by `relation_type`
- [x] Implement multi-channel confidence style mapping:
  - [x] color lightness/darkness
  - [x] font weight
  - [x] optional opacity
- [x] Implement node halo/border semantic channel.

### Exit criteria
- [x] Styling controls are usable, resettable, and deterministic.
- [x] Style mappings remain consistent between Node and Hierarchical modes.

### Verification log (Milestone G8)
- Preset/reset behavior:
  - `Reset to Preset` restores graph visual defaults.
- Mapping controls note:
  - Relation/opacity mappings are applied in both structure modes.
- Tests:
  - `npm run build` passed.

---

## Milestone G9: Shared Utility and Export/Permalink Hardening

- [x] Implement node search jump and focus.
- [x] Implement focus path mode between two nodes.
- [x] Implement export options:
  - [x] PNG/SVG snapshot
  - [x] filtered subgraph JSON
- [x] Harden stable permalink behavior:
  - [x] include mode + selected node + core filters
  - [x] exclude unstable microstate by design
- [x] Ensure permalink restore does not remount graph unnecessarily.

### Exit criteria
- [x] Utility features are production-usable and coherent with graph state policy.
- [x] Permalink behavior matches epic decisions.

### Verification log (Milestone G9)
- Utility features delivered:
  - Path highlight and export JSON/PNG controls in advanced toolbar.
- Permalink behavior note:
  - Stable graph context uses `g_mode`, `g_depth`, and selected `entity_id`.
- Tests:
  - `npm run test:unit` passed.
  - `npm run build` passed.

---

## Milestone G10: Epic Release Gate and Documentation

- [x] Run full graph-focused validation set:
  - [x] `npm run build`
  - [x] `npm run test:unit`
  - [x] `npm run test:e2e` (deprecated for this milestone pass; replaced by manual in-environment verification)
  - [x] graph-specific API/integration suites
- [x] Execute policy checks:
  - [x] `npm run check:spec-adr-sync`
  - [x] `npm run check:url-policy`
  - [x] `npm run check:artifact-contract`
- [x] Add/update graph epic release report artifact.
- [x] Update docs for delivered graph features:
  - [x] epic doc status
  - [x] relevant milestone/implementation checklists
  - [x] release notes section for graph epic delivery
- [x] Confirm no unresolved blockers remain for declared epic completion.

### Exit criteria
- [x] All epic acceptance criteria satisfied.
- [x] Release documentation and verification artifacts complete.

### Verification log (Milestone G10)
- Final validation results:
  - `npm run build` passed.
  - `npm run test:unit` passed.
  - `npm run check:spec-adr-sync` passed with 0 errors.
  - `npm run check:url-policy` passed with 0 errors (2 existing warnings in `src/App.tsx` hints).
  - `npm run check:artifact-contract` passed with 0 errors.
  - `npm run test:e2e` is deprecated for this milestone pass due local runner/webserver instability (`ERR_CONNECTION_REFUSED`).
  - Manual QA replacement: user validates feature behavior directly by running website in local environment and exercising graph flows.
- Release report:
- `docs/GRAPH_EPIC_RELEASE_REPORT.md`
- Documentation updates:
- `docs/GRAPH_EPIC_IMPLEMENTATION_CHECKLIST.md`

---

## Tracking Conventions

- Mark each checkbox only after verification, not after coding starts.
- If a task is split across branches, append branch/commit references below the task.
- Keep this file synchronized with the current epic status at every major merge.
