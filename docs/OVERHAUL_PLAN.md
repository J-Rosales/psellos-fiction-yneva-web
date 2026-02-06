# Overhaul Plan

## 1. Purpose

This plan defines the implementation path to evolve `psellos-fiction-yneva-web` into a portfolio-grade prosopography web application with robust navigation, discovery, and presentation quality.

This repository remains presentation-focused and read-only for canon. It consumes compiled artifacts from `psellos-builder` and does not ingest raw YAML/spec files at runtime.

## 2. Confirmed Scope

- Strong UI/UX and information architecture.
- Global lookup and filtering.
- Graph navigation with deep traversal and inference-based cluster views.
- Map navigation with place-first discovery and scale-modifier world support.
- Narrative-layer-aware filtering across graph, map, and index/query surfaces.
- Documentation and architecture decision records.

## 3. Non-Goals

- Defining canon or canonical domain logic in this repository.
- Replacing `psellos-builder` as source of truth.
- Runtime reads of raw data/spec files.

## 4. Product Outcomes

- Cohesive movement between Entity, Graph, and Map views with stable user context.
- High-quality portfolio presentation with exploratory UX.
- Read-only indexed query layer that improves routing/search performance while preserving artifact provenance.

## 5. Architecture Direction

### 5.1 Frontend
- Keep this repository as the presentation application.
- Use route-driven UI with URL-encoded state for most controls.
- Keep share links focused on stable analysis context instead of full UI microstate.

### 5.2 Indexing and Query Layer
- Use PostgreSQL as the read-only index database derived from compiled artifacts.
- Keep database disposable and reproducible from artifacts.
- Use DB-native indexing for initial search.
- PostGIS adoption is conditional on compatibility with scale-modifier world model.

### 5.3 API and Contract Lifecycle
- Resource-oriented HTTP endpoints as baseline.
- Frontend-internal contract first.
- Lightweight endpoint docs first; formal OpenAPI later.
- Start unversioned and version at first breaking change.

## 6. View Model and Routes

- `/` overview
- `/entities`
- `/entity/:id`
- `/graph`
- `/map`
- `/layers`
- `/search`
- `/diagnostics` (secondary/admin)

## 7. Core Functional Requirements

### 7.1 Shared Filter Model
Global filter keys:
- `layer`
- `rel_type`
- `q`
- `date_from`
- `date_to`
- `entity_type`
- `has_geo`

Behavior:
- `layer` defaults to `canon` when absent.
- Layer is hard-filter semantics.
- `Apply` and `Reset` are explicit; `Reset` includes `layer` reset.
- Pinning is global across routes.
- Incompatible pinned filters stay visible but inert until user resolves them.
- Major cross-view transitions prompt before carrying filters.

### 7.2 Graph View
- Pan/zoom and deep traversal available by default.
- Node selection opens side-panel card (compact by default, expandable).
- Client can fetch broad graph data and compute additional expansion locally.
- Best-effort full graph rendering.
- Edge labels visible by default.
- `View *` modes use rules-based inference from assertions/relations with weighted clustering.
- Cluster overlap supports multi-membership.
- Cluster precedence is configurable in Advanced options.

### 7.3 Map View
- Map is a primary discovery surface.
- Place-first exploration and place-then-entities grouping.
- Earth-like interaction model with scale modifier (radius/diameter) support.
- Initial rendering uses raw markers and feature/vector data.
- Marker selection opens shared side-panel card pattern.

### 7.4 Database and Query Surfaces
- Read/query surfaces accept route-relevant filters including `layer`.
- Query results are constrained to selected layer.
- Unknown layers return empty results with warning metadata.

## 8. Delivery Plan

### Phase 0: Baseline and Gap Analysis
- Audit current views/loaders and route behavior.
- Lock benchmark dataset and acceptance checks.

### Phase 1: Route and State Foundation
- Implement route shell, URL-state model, global search/filter controls.
- Implement prompt-based cross-view filter carry behavior.

### Phase 2: Indexing and Query Contracts
- Implement artifact-to-index pipeline on PostgreSQL.
- Implement read-only resource-oriented endpoints.
- Add strict required-field validation and warning metadata for unknown fields.

### Phase 3: Entity and Search Experience
- Build entity index/detail UX.
- Implement fuzzy default search + global exact toggle.
- Add deterministic tie-break behavior and forgiving parsing.

### Phase 4: Graph Experience
- Build deep traversal graph UX and side-panel interactions.
- Implement inference-based `View *` clustering controls.
- Add Advanced options for cluster precedence.

### Phase 5: Map Experience
- Build place-first map route with marker and panel interactions.
- Implement scale-modifier spatial behavior.
- Validate PostGIS fit; keep optional unless validated.

### Phase 6: Desktop Stable Release
- Finalize desktop-first release quality and documentation.
- Validate share-link behavior and URL round-trip behavior.

### Phase 7: Post-Stable Expansion
- Mobile release (touch-first simplified controls, full-screen detail takeover).
- Accessibility hardening phase.
- Observability and error-schema hardening.

## 9. Acceptance Criteria

- Graph, map, and query surfaces all enforce layer hard-filter behavior.
- URL round-trip restores encoded state.
- Full reset behavior includes `layer` reset to `canon`.
- Cross-view major-route transitions prompt before carrying filters.
- Graph and map use the same side-panel card interaction pattern.
- Place-first map grouping is implemented.
- Unknown/ambiguous semantics are shown explicitly in UI.
- Documentation stays aligned with implemented behavior.

## 10. Risks and Controls

- Schema drift in upstream artifacts.
  - Control: strict required-field validation and CI contract tests.
- Graph scale pressure from deep traversal + broad client fetch.
  - Control: confidence-first expansion ordering and user-driven exploration controls.
- Spatial model mismatch for non-default worlds.
  - Control: fixed scale-modifier policy and explicit compatibility checks before PostGIS adoption.

## 11. Governance Alignment

For cross-repository authority and uncertainty resolution, defer to:
- `psellos-hub` governance and `AUTHORITY_INDEX.yml`.