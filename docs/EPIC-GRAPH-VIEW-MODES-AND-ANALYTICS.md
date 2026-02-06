# Epic: Graph View Modes and Analytics

## 1. Epic Goal

Deliver a dual-mode graph experience:
- `Node View` for academic/prosopographical analysis,
- `Hierarchical View` for lineage-style exploration.

The epic must improve readability, preserve current interaction continuity, and add analysis-grade controls without breaking layer/filter semantics.

## 2. Scope and Boundaries

In scope:
- graph toolbar and mode controls,
- per-mode layout and visual rules,
- label zoom policy,
- readability spacing/overlap handling,
- analysis controls specific to each mode,
- shared UX and acceptance criteria.

Out of scope for this epic:
- map route behavior,
- entity route behavior,
- upstream canonical schema/ID conventions,
- inferential domain logic beyond presentation/ranking controls already defined by repo policy.

## 3. Shared Foundation (Applies to Both Modes)

### 3.1 Structure Mode Switch
- Add toolbar control: `Structure Mode`.
- Options:
  - `Node View`
  - `Hierarchical View`
- Default: `Node View`.

### 3.2 Shared Interaction Contracts
- Node selection -> side panel remains primary detail mechanism.
- Selection should persist across mode switch when possible.
- Filters/layer state must remain intact when switching modes.

### 3.3 Label Zoom Policy
- Labels scale with zoom in both modes.
- Low zoom prioritizes declutter; high zoom prioritizes readability.
- Optional threshold behavior is permitted (e.g., compact labels below a zoom level).

### 3.4 Shared Utility Features
- Node search jump: quick locate and focus specific entities.
- Focus path mode: highlight path between two selected nodes.
- Export options:
  - PNG/SVG snapshot
  - filtered subgraph JSON
- Stable permalink support:
  - includes mode + selected node + core filters.

### 3.5 Graph-Proximity Lazy Loading Strategy
- Use topology-based incremental loading (not camera/pan-based loading).
- Initial load should include seed node plus near neighbors (for example depth 1-2).
- Expansion should be user-driven:
  - explicit "expand neighbors" actions,
  - optional controlled prefetch of next-hop neighborhoods.
- UI must indicate partial graph state (collapsed/unloaded neighbors), so users know more nodes exist.

### 3.6 Node Selection Navigation Behavior
- Clicking a node should not reload/re-mount the entire graph surface.
- Graph instance should persist; selection updates should:
  - update side panel state,
  - pan/animate focus to selected node.
- Layout recalculation should be reserved for meaningful structural changes (mode/filter/data expansion), not basic selection.

### 3.7 Graph Styling Mapping and Presets
- Add a graph styling control set in graph toolbar (dedicated row or clearly separated control group).
- Provide a curated default preset and `Reset to Preset` action.
- User can edit style mappings during session; persistence is session-only.
- Style scope is global across graph modes (Node View + Hierarchical View).
- Confidence encoding uses multi-channel mapping (not single-channel only), combining:
  - color lightness/darkness,
  - font weight,
  - optional opacity channel.

### 3.8 Styling Mapping Dimensions
- Node mappings:
  - color by `entity_type`,
  - shape by `entity_type`.
- Edge mappings:
  - color by `relation_type`,
  - line type by `relation_type`.
- Secondary semantic channel:
  - node halo/border semantics for additional metadata encoding (e.g., provenance tier/source quality class).

## 4. Mode A: Node View (Academic Prosopographical)

### 4.1 Purpose
Support high-density analytical exploration across multiple relation types, uncertainty contexts, and overlapping clusters.

### 4.2 Layout and Readability
- Use force/network layout as baseline.
- Increase spacing to reduce label overlap materially.
- Keep edge labels visible under normal analysis zoom.

### 4.3 Analysis Features
- Relation filter chips for quick include/exclude sets.
- Confidence/evidence encoding on edges:
  - width/color/opacity by confidence or source strength.
- Time slicing controls:
  - bounded range to inspect relationship evolution.
- Ambiguity signaling:
  - explicit visual markers for uncertain/ambiguous relationships or identity collisions.

### 4.4 Evidence UX
- Side panel should expose citation/source trail where available.
- Relation cards should indicate which signals are direct assertions vs inferred grouping cues.

## 5. Mode B: Hierarchical View (Lineage Exploration)

### 5.1 Purpose
Enable top-down lineage exploration (ancestor/superior -> descendant/subordinate) with strong structural legibility.

### 5.2 Layout and Geometry
- Use layered hierarchy orientation:
  - predecessor/superior tiers above,
  - descendant/subordinate tiers below.
- Connectors should read as tree/hierarchy lines, not generic force-network edges.

### 5.3 Node Visuals
- Nodes are rectangular.
- Label is inside node rectangle.
- Rectangle can be promoted to card-like node if metadata density is enabled.

### 5.4 Hierarchy-Specific Features
- Root selector:
  - "Set as root ancestor/superior."
- Branch collapse/expand:
  - prune large subtrees for readability.
- Generation/level bands:
  - explicit tier markers for orientation.
- Relationship lanes/styles:
  - optional visual distinction (biological/marital/adoptive/political).
- Duplicate identity handling across branches:
  - clear same-entity indicators when mirrored or linked.

## 6. UX Consistency and Safety Rules

- Mode switch must be reversible with minimal latency.
- Side panel behavior must remain consistent.
- No mode may silently drop active core filters.
- Unknown/future fields must not crash rendering (forward compatibility).
- Expansion/loading behavior must be deterministic and explainable (no opaque auto-appearance based only on viewport motion).

## 7. Delivery Slices

### Slice 1 (Core)
- `Structure Mode` switch.
- Node View spacing improvements.
- Hierarchical layout with rectangular labeled nodes.
- Shared zoom-based label scaling.
- Persistent graph instance + non-reload node focus behavior.

### Slice 2 (Analysis Controls)
- Node View confidence/evidence encoding.
- Node View relation quick filters.
- Hierarchical root selector + branch collapse/expand.
- Topology-based incremental expansion controls.
- Graph styling controls:
  - preset + reset,
  - node/edge semantic mapping editors,
  - multi-channel confidence style mapping.

### Slice 3 (Advanced)
- Time slicing in Node View.
- Generation bands and relationship lanes in Hierarchical View.
- Focus path mode + export + permalink hardening.
- Optional next-hop prefetch with explicit partial-graph indicators.
- Node halo/border semantic channel rollout and validation.

## 8. Acceptance Criteria

1. Toolbar includes `Structure Mode` with `Node View` and `Hierarchical View`.
2. Node View readability is improved so default label overlap is significantly reduced.
3. Hierarchical View renders top-to-bottom structure with rectangular labeled nodes.
4. Labels resize consistently with zoom in both modes.
5. Node selection and side panel detail remain functional in both modes.
6. Mode switch preserves layer/core filter semantics.
7. Node click does not force full graph reload or page jump; focus pans to selected node.
8. Graph expansion is topology-driven (neighbor/proximity in graph), not viewport-driven.
9. Styling controls support preset + reset and session-only user edits.
10. Global styling mappings apply consistently in both `Node View` and `Hierarchical View`.
11. Confidence visual encoding uses multi-channel mapping.
12. At least Slice 1 is complete before this epic is marked minimally delivered.

## 9. Open Decisions

1. URL persistence strategy for mode and advanced graph controls:
  - Decision: include only stable analysis context (`mode + selected node + core filters`), not full graph microstate.
2. Hierarchical relation styling:
  - Decision: single connector style in initial release.
3. Rectangular node density:
  - Decision: label-only rectangular nodes in initial release.
4. Node View analysis sequence:
  - Decision: implement confidence encoding + relation quick filters before time slicing.
5. Duplicate identity handling in Hierarchical View:
  - Decision: single canonical node with cross-links (no mirrored duplicates in initial release).
