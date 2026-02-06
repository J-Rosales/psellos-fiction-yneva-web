# Implementation Checklist

This is the single execution checklist for implementing the overhaul defined in:
- `docs/OVERHAUL_PLAN.md`
- `docs/UX_NAV_SPEC.md`
- `docs/DATA_QUERY_SPEC.md`
- `docs/ADR/*`

Repository constraints remain in force:
- presentation-only with respect to canon,
- compiled artifacts only,
- no raw YAML/spec runtime reads.

## Now / Next / Blocked

## Now
- [ ] Create Fastify service skeleton with typed route modules.
- [ ] Add Zod schemas for request parsing and response shaping.
- [ ] Implement baseline endpoint stubs for read-only API routes.

## Next
- [ ] Enforce layer hard-filter semantics in all relevant endpoints.
- [ ] Implement PostgreSQL schema and batch ingest pipeline from compiled artifacts.
- [ ] Add API integration tests for layer behavior and error shape.

## Blocked
- [ ] PostGIS enablement decision
Blocker: compatibility validation for scale-modifier world model.
- [ ] External/public API support
Blocker: internal stability gates not yet satisfied.

---

## Milestone 0: Foundation Baseline and Guardrails

- [x] Confirm compiled artifact set in `public/data/` supports current dev flows.
- [x] Run artifact contract checks and record results.
- [x] Verify docs and ADRs remain synchronized after stack changes.
- [x] Ensure `README.md` setup and scope text matches current implementation reality.
- [x] Establish baseline build/dev commands and verify local run path.

### Exit criteria
- [x] `npm run build` passes.
- [x] No spec/ADR drift on core policy statements.
- [x] Artifact contract errors are zero (warnings acceptable if documented).

### Verification log (Milestone 0)
- Artifact audit report: `docs/m0-artifact-audit.json`
- Spec/ADR sync report: `docs/m0-spec-adr-sync.json`
- URL policy report: `docs/m0-url-policy.json`
- Build check: `npm run build` passed locally
- Dev path check: `npm run dev` starts locally (`npm run dev -- --host 127.0.0.1 --port 4173 --strictPort`)

---

## Milestone 1: Frontend Core Shell (React + MUI + Router State)

- [x] Create root MUI theme module and provider wiring.
- [ ] Add top-level app shell with:
  - [x] app header
  - [x] global search input
  - [x] global layer selector
  - [x] navigation tabs/routes
- [x] Define route map in React:
  - [x] `/`
  - [x] `/entities`
  - [x] `/entity/:id`
  - [x] `/graph`
  - [x] `/map`
  - [x] `/layers`
  - [x] `/search`
  - [x] `/diagnostics`
- [x] Implement URL encode/decode utilities for shared filter state.
- [x] Implement explicit `Apply` and `Reset` behavior.
- [x] Implement full reset including `layer -> canon`.
- [x] Implement global filter pinning behavior.
- [x] Implement inert display for incompatible pinned filters.
- [x] Implement prompt on major cross-view filter carry.

### Exit criteria
- [x] URL round-trip restores encoded state.
- [x] Back/forward restores encoded state.
- [x] Core filter policy behavior matches `docs/UX_NAV_SPEC.md`.

### Verification log (Milestone 1)
- React route map and shell implemented in `src/router.tsx` and `src/App.tsx`.
- Theme provider and baseline MUI theme implemented in `src/main.tsx` and `src/theme/appTheme.ts`.
- Filter URL-state and pinning logic implemented in `src/routing/coreFilters.ts` and `src/state/filterPinStore.ts`.
- Build verification: `npm run build` passed after Milestone 1 implementation.

---

## Milestone 2: Data and API Core (Fastify + PostgreSQL Index)

- [ ] Create Fastify service skeleton with typed route modules.
- [ ] Add Zod schemas for request parsing and response shaping.
- [ ] Implement baseline endpoint stubs:
  - [ ] `GET /api/entities`
  - [ ] `GET /api/entities/:id`
  - [ ] `GET /api/assertions`
  - [ ] `GET /api/graph/neighborhood`
  - [ ] `GET /api/map/features`
  - [ ] `GET /api/layers`
  - [ ] `GET /api/layers/:id/changelog`
- [ ] Enforce layer hard-filter semantics in all relevant endpoints.
- [ ] Add default `layer=canon` behavior when absent.
- [ ] Return empty+warning metadata for unknown layer.
- [ ] Add minimal consistent error shape (`status`, `message`, `request_id`, optional `layer`).
- [ ] Implement PostgreSQL schema for persons/assertions/layers/edges/places/link tables.
- [ ] Build batch ingest pipeline from compiled artifacts.
- [ ] Add ingest report output (counts, warnings, failures).

### Exit criteria
- [ ] API route integration tests pass for layer behavior and error shape.
- [ ] Ingest from compiled artifacts is repeatable and idempotent.
- [ ] No runtime dependency on raw YAML/spec files.

---

## Milestone 3: Entity and Search Experience

- [ ] Build `/entities` with MUI X DataGrid using server-side query mode.
- [ ] Build `/entity/:id` with MUI card/panel composition and linked assertions.
- [ ] Implement global search pipeline with:
  - [ ] fuzzy default
  - [ ] exact global toggle
  - [ ] deterministic tie-break ordering
- [ ] Support hard include/exclude `rel_type`.
- [ ] Surface unknown/ambiguous buckets explicitly.
- [ ] Add loading/empty/error states to entity and search views.

### Exit criteria
- [ ] Entity and search screens function with server-side data.
- [ ] Search/query semantics match `docs/DATA_QUERY_SPEC.md`.

---

## Milestone 4: Graph Experience (Cytoscape)

- [ ] Build `/graph` route container with Cytoscape integration.
- [ ] Implement deep traversal default behavior.
- [ ] Implement client-driven expansion interactions.
- [ ] Enforce confidence-first expansion ordering in UI/data flow.
- [ ] Implement shared side-panel card behavior:
  - [ ] compact summary default
  - [ ] expand-on-demand
- [ ] Show edge labels by default.
- [ ] Implement `View *` inference modes:
  - [ ] `View Dynasty`
  - [ ] `View Workplace`
- [ ] Allow multi-membership across clusters.
- [ ] Add Advanced options for cluster precedence controls.

### Exit criteria
- [ ] Graph behaviors match ADR-0003 and UX spec.
- [ ] Layer hard-filter remains intact under graph interactions.

---

## Milestone 5: Map Experience (MapLibre, Place-First)

- [ ] Build `/map` route container with MapLibre integration.
- [ ] Implement place-first discovery workflow.
- [ ] Group results by place then entities.
- [ ] Implement raw-marker initial rendering.
- [ ] Implement shared side-panel card pattern (same interaction model as graph).
- [ ] Implement scale-modifier settings in map config flow.
- [ ] Keep tile pipeline out of initial release.
- [ ] Add explicit handling for unknown/ambiguous map-linked semantics.

### Exit criteria
- [ ] Map behavior matches ADR-0004 and UX spec.
- [ ] Layer hard-filter semantics preserved on map queries.

---

## Milestone 6: Layers, Diagnostics, and Policy Hardening

- [ ] Reconcile existing layer compare/diagnostics tools with new shell.
- [ ] Ensure narrative layer filtering works consistently in:
  - [ ] graph
  - [ ] map
  - [ ] query/database surfaces
- [ ] Add diagnostics route integration for data quality checks.
- [ ] Add basic observability hooks (logs + latency metrics) on API.
- [ ] Add skill-driven checks in workflow:
  - [ ] spec/ADR sync
  - [ ] URL/filter policy
  - [ ] artifact contract audit

### Exit criteria
- [ ] Layer policy is verifiably consistent across all relevant views.
- [ ] Diagnostics and policy checks are runnable and documented.

---

## Milestone 7: Desktop Stable Release Gate

- [ ] Run full build/test suite.
- [ ] Run release gate checks and collect report.
- [ ] Verify documentation reflects implemented behavior.
- [ ] Confirm share-link semantics and URL-state restoration.
- [ ] Confirm unknown/ambiguous state handling in UI.
- [ ] Publish release notes for desktop stable.

### Exit criteria
- [ ] Desktop stable quality threshold passed.
- [ ] Main branch tagged/released with reproducible build.

---

## Milestone 8: Post-Stable Expansion

- [ ] Mobile release track:
  - [ ] touch-first simplified controls
  - [ ] full-screen detail takeover pattern
- [ ] Accessibility hardening:
  - [ ] keyboard/focus audits
  - [ ] ARIA and semantic coverage improvements
- [ ] Error schema hardening beyond minimal baseline.
- [ ] Observability expansion (structured telemetry and audit metadata policy).
- [ ] Evaluate external API support against stability gates.

### Exit criteria
- [ ] Post-stable scope completed and documented.
- [ ] If external API is enabled, stability-gate conditions are satisfied.

---

## Tracking Conventions

- Mark each checkbox only after verification, not after coding starts.
- When a task spans multiple PRs, append a short note below the task with PR/commit reference.
- Keep this file updated on every major merge to `main`.
