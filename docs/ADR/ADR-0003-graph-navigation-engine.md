# ADR-0003: Graph Navigation Engine

- Status: Accepted
- Date: 2026-02-06

## Context

Graph exploration is now a core requirement, including node interactions, filtering, and layer-constrained navigation.

## Decision

Adopt a dedicated graph rendering engine that supports:
- pan/zoom,
- node/edge interactivity,
- deep traversal by default,
- client-driven expansion behavior,
- best-effort full graph rendering at available dataset scale.

Interaction and semantics details:
- Node click opens a side-panel card (compact by default, expandable).
- Edge labels are visible by default.
- `View *` cluster modes are inference-based and derived from assertions/relations.
- Clustering uses weighted/scored semantics.
- Multi-membership across clusters is allowed.
- Cluster precedence is user-selectable in Advanced options.
- Expansion ordering prioritizes highest-confidence edges first.
- Layer filtering is hard-filter semantics.

## Consequences

Positive:
- Better UX for prosopographical relationship exploration.
- Cleaner separation between graph data query and visual rendering.
- Supports advanced exploration while preserving consistent query boundaries.

Tradeoff:
- Additional dependency and integration surface.
- High-volume traversal can increase client memory/render pressure if not carefully profiled.
