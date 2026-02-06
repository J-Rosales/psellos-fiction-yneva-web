# Graph Epic Implementation Checklist

This is the execution checklist for implementing the full scope in:
- `docs/EPIC-GRAPH-VIEW-MODES-AND-ANALYTICS.md`

Repository constraints remain in force:
- presentation-only with respect to canon,
- compiled artifacts only,
- no runtime reads of raw YAML/spec files.

## Now / Next / Blocked

## Now
- [ ] Implement `Structure Mode` switch in graph toolbar.
- [ ] Prevent graph remount/reload on node click; pan/focus selected node instead.
- [ ] Implement Node View spacing improvements to reduce label overlap.

## Next
- [ ] Implement Hierarchical View baseline layout and rectangular node labels.
- [ ] Add topology-driven incremental expansion controls.
- [ ] Add styling preset/reset + semantic mapping controls.

## Blocked
- [ ] Advanced hierarchical relationship lanes by relation class
Blocker: relation-class display taxonomy finalization.
- [ ] Optional next-hop automatic prefetch strategy
Blocker: UX policy decision on prefetch aggressiveness and indicator semantics.

---

## Milestone G0: Epic Baseline and Contract Alignment

- [ ] Verify epic doc and core specs have no policy conflicts:
  - [ ] `docs/EPIC-GRAPH-VIEW-MODES-AND-ANALYTICS.md`
  - [ ] `docs/UX_NAV_SPEC.md`
  - [ ] `docs/DATA_QUERY_SPEC.md`
  - [ ] `docs/OVERHAUL_PLAN.md`
- [ ] Confirm current graph route baseline behavior and capture current-state notes.
- [ ] Define graph-specific verification matrix (unit + API + e2e targets).

### Exit criteria
- [ ] No unresolved spec/epic contradictions.
- [ ] Graph verification matrix documented in this file.

### Verification log (Milestone G0)
- Spec/epic check report:
- Current-state graph behavior note:
- Verification matrix note:

---

## Milestone G1: Structure Mode and Stable Interaction Foundation

- [ ] Add toolbar `Structure Mode` control:
  - [ ] `Node View`
  - [ ] `Hierarchical View`
- [ ] Default mode to `Node View`.
- [ ] Preserve active core filters and layer on mode switch.
- [ ] Preserve selected node context on mode switch where feasible.
- [ ] Ensure side panel contract remains identical across modes.

### Exit criteria
- [ ] Mode switch is functional, reversible, and does not break existing graph navigation.
- [ ] Selection/panel state continuity works across mode switch.

### Verification log (Milestone G1)
- Implemented files:
- Unit/e2e checks:

---

## Milestone G2: Node View Readability and Non-Reload Selection

- [ ] Refactor graph route to keep a persistent Cytoscape instance.
- [ ] Ensure node click does not trigger graph remount/reload.
- [ ] Implement focus behavior on node select:
  - [ ] pan/animate to selected node
  - [ ] no page jump to top
- [ ] Tune force layout spacing to materially reduce label overlap:
  - [ ] node repulsion tuning
  - [ ] ideal edge length tuning
  - [ ] spacing/padding adjustments
  - [ ] optional overlap-removal pass
- [ ] Keep edge labels visible under normal analysis zoom.

### Exit criteria
- [ ] Node selection is smooth and non-destructive (no remount/page reset).
- [ ] Default graph framing significantly reduces label collision.

### Verification log (Milestone G2)
- Layout tuning note:
- Interaction verification note:
- Tests:

---

## Milestone G3: Shared Zoom Label Policy

- [ ] Implement label scaling by zoom in both modes.
- [ ] Add declutter policy at low zoom (threshold/compact behavior).
- [ ] Validate readability at medium/high zoom.
- [ ] Ensure labels remain consistent with accessibility contrast requirements.

### Exit criteria
- [ ] Labels scale predictably with zoom in Node and Hierarchical modes.
- [ ] Low-zoom clutter reduced without hiding critical context.

### Verification log (Milestone G3)
- Zoom policy details:
- Verification tests:

---

## Milestone G4: Hierarchical View Baseline Delivery

- [ ] Implement layered hierarchical layout orientation:
  - [ ] predecessors/superiors above
  - [ ] descendants/subordinates below
- [ ] Implement hierarchy-style connector behavior.
- [ ] Implement rectangular nodes with internal label rendering.
- [ ] Keep node click -> side panel behavior identical to Node View.
- [ ] Keep filter/layer semantics intact in Hierarchical mode.

### Exit criteria
- [ ] Hierarchical mode is structurally distinct and readable.
- [ ] Rectangular labeled nodes render correctly.

### Verification log (Milestone G4)
- Layout/connector notes:
- Visual regression notes:
- Tests:

---

## Milestone G5: Topology-Driven Incremental Loading and Expansion

- [ ] Implement initial graph loading by topology proximity:
  - [ ] seed + near-neighbor depth baseline
- [ ] Add explicit expansion controls:
  - [ ] expand neighbors for selected node
  - [ ] preserve existing graph context on expansion
- [ ] Ensure deduping/merge behavior for nodes/edges across expansions.
- [ ] Add partial-graph indicators:
  - [ ] show that unloaded/collapsed neighbors exist
  - [ ] make expansion state explicit and deterministic
- [ ] Explicitly avoid viewport-driven auto-load behavior.

### Exit criteria
- [ ] Expansion is user-driven and predictable.
- [ ] Graph remains coherent under repeated expansions.

### Verification log (Milestone G5)
- Expansion model note:
- Deduping/merge behavior note:
- Tests:

---

## Milestone G6: Node View Analysis Controls

- [ ] Add relation quick filter chips (include/exclude semantics).
- [ ] Add confidence/evidence encoding on edges:
  - [ ] width and/or opacity channel
  - [ ] color intensity channel
- [ ] Add ambiguity signaling overlays/markers.
- [ ] Add source/citation surfacing in side panel relation details.
- [ ] Add time slicing controls (bounded range) for Node View.

### Exit criteria
- [ ] Node View supports analysis workflows beyond basic navigation.
- [ ] Confidence/evidence and ambiguity are visually explicit.

### Verification log (Milestone G6)
- Analysis controls implemented:
- Data semantics checks:
- Tests:

---

## Milestone G7: Hierarchical View Exploration Controls

- [ ] Implement root selector:
  - [ ] set selected node as root ancestor/superior
- [ ] Implement branch collapse/expand behavior.
- [ ] Implement generation/level bands.
- [ ] Implement duplicate identity policy:
  - [ ] single canonical node with cross-links
- [ ] Keep connector style single-class for initial release (per epic decision).

### Exit criteria
- [ ] Hierarchical exploration is practical on medium/large trees.
- [ ] Duplicate identity handling is explicit and non-confusing.

### Verification log (Milestone G7)
- Root/branch behavior notes:
- Generation band notes:
- Tests:

---

## Milestone G8: Graph Styling Mapping and Preset System

- [ ] Add dedicated styling controls area in graph toolbar.
- [ ] Implement default styling preset.
- [ ] Implement `Reset to Preset` action.
- [ ] Implement session-only user style editing.
- [ ] Implement global scope style application across both modes.
- [ ] Implement node semantic mapping controls:
  - [ ] color by `entity_type`
  - [ ] shape by `entity_type`
- [ ] Implement edge semantic mapping controls:
  - [ ] color by `relation_type`
  - [ ] line type by `relation_type`
- [ ] Implement multi-channel confidence style mapping:
  - [ ] color lightness/darkness
  - [ ] font weight
  - [ ] optional opacity
- [ ] Implement node halo/border semantic channel.

### Exit criteria
- [ ] Styling controls are usable, resettable, and deterministic.
- [ ] Style mappings remain consistent between Node and Hierarchical modes.

### Verification log (Milestone G8)
- Preset/reset behavior:
- Mapping controls note:
- Tests:

---

## Milestone G9: Shared Utility and Export/Permalink Hardening

- [ ] Implement node search jump and focus.
- [ ] Implement focus path mode between two nodes.
- [ ] Implement export options:
  - [ ] PNG/SVG snapshot
  - [ ] filtered subgraph JSON
- [ ] Harden stable permalink behavior:
  - [ ] include mode + selected node + core filters
  - [ ] exclude unstable microstate by design
- [ ] Ensure permalink restore does not remount graph unnecessarily.

### Exit criteria
- [ ] Utility features are production-usable and coherent with graph state policy.
- [ ] Permalink behavior matches epic decisions.

### Verification log (Milestone G9)
- Utility features delivered:
- Permalink behavior note:
- Tests:

---

## Milestone G10: Epic Release Gate and Documentation

- [ ] Run full graph-focused validation set:
  - [ ] `npm run build`
  - [ ] `npm run test:unit`
  - [ ] `npm run test:e2e`
  - [ ] graph-specific API/integration suites
- [ ] Execute policy checks:
  - [ ] `npm run check:spec-adr-sync`
  - [ ] `npm run check:url-policy`
  - [ ] `npm run check:artifact-contract`
- [ ] Add/update graph epic release report artifact.
- [ ] Update docs for delivered graph features:
  - [ ] epic doc status
  - [ ] relevant milestone/implementation checklists
  - [ ] release notes section for graph epic delivery
- [ ] Confirm no unresolved blockers remain for declared epic completion.

### Exit criteria
- [ ] All epic acceptance criteria satisfied.
- [ ] Release documentation and verification artifacts complete.

### Verification log (Milestone G10)
- Final validation results:
- Release report:
- Documentation updates:

---

## Tracking Conventions

- Mark each checkbox only after verification, not after coding starts.
- If a task is split across branches, append branch/commit references below the task.
- Keep this file synchronized with the current epic status at every major merge.
