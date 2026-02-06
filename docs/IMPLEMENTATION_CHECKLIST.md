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
- [ ] Run full build/test suite.
- [ ] Run release gate checks and collect report.
- [ ] Verify documentation reflects implemented behavior.

## Next
- [ ] Confirm share-link semantics and URL-state restoration.
- [ ] Confirm unknown/ambiguous state handling in UI.
- [ ] Publish release notes for desktop stable.

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

- [x] Create Fastify service skeleton with typed route modules.
- [x] Add Zod schemas for request parsing and response shaping.
- [x] Implement baseline endpoint stubs:
  - [x] `GET /api/entities`
  - [x] `GET /api/entities/:id`
  - [x] `GET /api/assertions`
  - [x] `GET /api/graph/neighborhood`
  - [x] `GET /api/map/features`
  - [x] `GET /api/layers`
  - [x] `GET /api/layers/:id/changelog`
- [x] Enforce layer hard-filter semantics in all relevant endpoints.
- [x] Add default `layer=canon` behavior when absent.
- [x] Return empty+warning metadata for unknown layer.
- [x] Add minimal consistent error shape (`status`, `message`, `request_id`, optional `layer`).
- [x] Implement PostgreSQL schema for persons/assertions/layers/edges/places/link tables.
- [x] Build batch ingest pipeline from compiled artifacts.
- [x] Add ingest report output (counts, warnings, failures).

### Exit criteria
- [x] API route integration tests pass for layer behavior and error shape.
- [x] Ingest from compiled artifacts is repeatable and idempotent.
- [x] No runtime dependency on raw YAML/spec files.

### Verification log (Milestone 2)
- API skeleton and typed modules implemented in `backend/src/app.ts` and `backend/src/routes/*`.
- Zod request schemas and response helpers implemented in `backend/src/lib/contracts.ts` and `backend/src/lib/response.ts`.
- PostgreSQL schema added at `backend/sql/schema.sql`.
- Batch ingest pipeline added at `backend/scripts/ingestCompiledArtifacts.mjs`.
- Ingest dry-run report: `docs/m2-ingest-report.json`.
- API integration tests: `backend/tests/api.integration.test.ts` (pass).
- Build + unit + e2e verification passed after Milestone 2 implementation.

---

## Milestone 3: Entity and Search Experience

- [x] Build `/entities` with MUI X DataGrid using server-side query mode.
- [x] Build `/entity/:id` with MUI card/panel composition and linked assertions.
- [x] Implement global search pipeline with:
  - [x] fuzzy default
  - [x] exact global toggle
  - [x] deterministic tie-break ordering
- [x] Support hard include/exclude `rel_type`.
- [x] Surface unknown/ambiguous buckets explicitly.
- [x] Add loading/empty/error states to entity and search views.

### Exit criteria
- [x] Entity and search screens function with server-side data.
- [x] Search/query semantics match `docs/DATA_QUERY_SPEC.md`.

### Verification log (Milestone 3)
- Entities route implemented with MUI X server pagination in `src/views/entitiesRoute.tsx`.
- Entity detail route implemented with linked assertions panel in `src/views/entityDetailRoute.tsx`.
- Search route implemented with global fuzzy/exact behavior in `src/views/searchRoute.tsx`.
- API search semantics implemented in `backend/src/lib/repository.ts` and wired in `backend/src/routes/entities.ts`.
- Build verification: `npm run build` passed.
- Unit/integration verification: `npm run test:unit` passed.

---

## Milestone 4: Graph Experience (Cytoscape)

- [x] Build `/graph` route container with Cytoscape integration.
- [x] Implement deep traversal default behavior.
- [x] Implement client-driven expansion interactions.
- [x] Enforce confidence-first expansion ordering in UI/data flow.
- [x] Implement shared side-panel card behavior:
  - [x] compact summary default
  - [x] expand-on-demand
- [x] Show edge labels by default.
- [x] Implement `View *` inference modes:
  - [x] `View Dynasty`
  - [x] `View Workplace`
- [x] Allow multi-membership across clusters.
- [x] Add Advanced options for cluster precedence controls.

### Exit criteria
- [x] Graph behaviors match ADR-0003 and UX spec.
- [x] Layer hard-filter remains intact under graph interactions.

### Verification log (Milestone 4)
- Graph route implemented with Cytoscape in `src/views/graphRoute.tsx`.
- Graph API neighborhood depth/seed/relation filtering and confidence ordering implemented in `backend/src/routes/graph.ts` and `backend/src/lib/repository.ts`.
- Cluster inference modes and advanced precedence controls implemented in `src/views/graphRoute.tsx`.
- Verification tests added:
  - `backend/tests/milestone4.verification.test.ts`
  - `src/views/graphRoute.test.ts`
- Build verification: `npm run build` passed.
- Unit/integration verification: `npm run test:unit` passed.

---

## Milestone 5: Map Experience (MapLibre, Place-First)

- [x] Build `/map` route container with MapLibre integration.
- [x] Implement place-first discovery workflow.
- [x] Group results by place then entities.
- [x] Implement raw-marker initial rendering.
- [x] Implement shared side-panel card pattern (same interaction model as graph).
- [x] Implement scale-modifier settings in map config flow.
- [x] Keep tile pipeline out of initial release.
- [x] Add explicit handling for unknown/ambiguous map-linked semantics.

### Exit criteria
- [x] Map behavior matches ADR-0004 and UX spec.
- [x] Layer hard-filter semantics preserved on map queries.

### Verification log (Milestone 5)
- Map API place-first grouping and unknown/ambiguous buckets implemented in `backend/src/routes/map.ts` and `backend/src/lib/repository.ts`.
- Map route implemented with MapLibre raw markers, place-first side panel, and scale-modifier controls in `src/views/mapRoute.tsx`.
- Map route wired in `src/router.tsx`; map API client in `src/api/client.ts`.
- Milestone 5 verification tests added in `backend/tests/milestone5.verification.test.ts`.
- Marker extraction unit test added in `src/views/mapUtils.test.ts`.
- Build verification: `npm run build` passed.
- Unit/integration verification: `npm run test:unit` passed.

---

## Milestone 6: Layers, Diagnostics, and Policy Hardening

- [x] Reconcile existing layer compare/diagnostics tools with new shell.
- [x] Ensure narrative layer filtering works consistently in:
  - [x] graph
  - [x] map
  - [x] query/database surfaces
- [x] Add diagnostics route integration for data quality checks.
- [x] Add basic observability hooks (logs + latency metrics) on API.
- [x] Add skill-driven checks in workflow:
  - [x] spec/ADR sync
  - [x] URL/filter policy
  - [x] artifact contract audit

### Exit criteria
- [x] Layer policy is verifiably consistent across all relevant views.
- [x] Diagnostics and policy checks are runnable and documented.

### Verification log (Milestone 6)
- Layer and diagnostics route views implemented in:
  - `src/views/layersRoute.tsx`
  - `src/views/diagnosticsRoute.tsx`
- Routes integrated into app shell in `src/router.tsx`.
- Diagnostics API endpoints implemented in `backend/src/routes/diagnostics.ts`:
  - `GET /api/diagnostics/layer-consistency`
  - `GET /api/diagnostics/metrics`
- Basic API observability hooks and in-memory metrics implemented in `backend/src/lib/observability.ts` and wired in `backend/src/app.ts`.
- Skill-driven policy workflow scripts added in `package.json`:
  - `check:spec-adr-sync`
  - `check:url-policy`
  - `check:artifact-contract`
  - `check:milestone6`
- Policy check reports generated:
  - `docs/check-spec-adr-sync.json`
  - `docs/check-url-policy.json`
  - `docs/check-artifact-contract.json`
- Milestone 6 verification tests added:
  - `backend/tests/milestone6.verification.test.ts`
  - `backend/tests/policy-checks.verification.test.ts`
- Build verification: `npm run build` passed.
- Unit/integration verification: `npm run test:unit` passed.
- Policy workflow verification: `npm run check:milestone6` passed (2 URL-policy warnings, 0 errors).

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
