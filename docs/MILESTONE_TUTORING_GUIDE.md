# Milestone Tutoring Guide (Why + How)

This guide assumes:
- you already know plain `HTML/CSS/JS`,
- you conceptually understand React, components, and state,
- you want to understand why this project evolved milestone-by-milestone and how each part was implemented.

## Milestone 0: Baseline and Guardrails

### Why
Before adding features, we locked constraints:
- this repo is presentation-only,
- reads compiled artifacts only,
- no runtime reads of raw YAML/spec files.

If this is not enforced early, every later decision drifts.

### How
1. Validate artifact availability under `public/data/`.
Explanation: this confirms the frontend has the compiled inputs it is allowed to consume. Missing files here usually means upstream build/publish drift.
Snippet:
```txt
public/data/manifest.json
public/data/persons.json
public/data/assertions_by_id.json
```

2. Align docs/ADR statements.
Explanation: the implementation and the written contract must match, otherwise future work is built on conflicting assumptions.
Snippet:
```txt
docs/OVERHAUL_PLAN.md
docs/UX_NAV_SPEC.md
docs/DATA_QUERY_SPEC.md
docs/ADR/*
```

3. Verify baseline commands (`build`, `dev`).
Explanation: this is your "known good" checkpoint before functional work starts.
Snippet:
```bash
npm run build
npm run dev
```

---

## Milestone 1: App Shell + URL State Policy

### Why
A multi-view product (entities/graph/map/layers/search/diagnostics) needs a stable global interaction model.  
URL-driven state gives:
- shareable analysis context,
- browser back/forward reliability,
- deterministic restoration.

### How
1. Build route shell in `src/router.tsx`.
Explanation: route-first structure makes each major surface explicit and keeps navigation behavior centralized.
Snippet:
```ts
const routeTree = rootRoute.addChildren([
  indexRoute,
  entitiesRoute,
  entityRoute,
  graphRoute,
  mapRoute,
  layersRoute,
  searchRoute,
  diagnosticsRoute,
]);
```

2. Centralize filter model in `src/state/filterPinStore.ts`.
Explanation: one canonical filter shape avoids per-view drift and simplifies cross-view pinning/carry.
Snippet:
```ts
export interface CoreFilters {
  layer: string;
  q: string;
  exact: boolean;
  rel_type: string;
  date_from: string;
  date_to: string;
  entity_type: string;
  has_geo: 'any' | 'yes' | 'no';
}
```

3. Add parse/serialize in `src/routing/coreFilters.ts`.
Explanation: URL <-> state conversion is the core mechanic for reproducible navigation.
Snippet:
```ts
const params = toSearchParamsForPath(pathname, filters);
void navigate({ to: pathname, search: toSearchObject(params) });
```

4. Implement Apply/Reset/pinning + carry prompt in `src/App.tsx`.
Explanation: explicit commit/reset actions reduce accidental state mutation while still allowing power workflows.
Snippet:
```ts
if (isMajorTransition && hasActiveFilters(sourceFilters)) {
  const shouldCarry = window.confirm('Carry current filters to the selected view?');
  if (!shouldCarry) {
    outgoingFilters = DEFAULT_CORE_FILTERS;
  }
}
```

---

## Milestone 2: API + Read-Only Data Core

### Why
Frontend-only artifact parsing becomes brittle when views get complex.  
A read-only API layer gives:
- one place for query semantics,
- consistent error/meta shapes,
- future indexing path (PostgreSQL).

### How
1. Create Fastify app in `backend/src/app.ts`.
Explanation: this becomes the single backend runtime where route modules and hooks are composed.
Snippet:
```ts
const app = Fastify({ logger: true });
await registerEntityRoutes(app, repo);
await registerAssertionRoutes(app, repo);
```

2. Split typed route modules (`backend/src/routes/*`).
Explanation: route-level separation keeps each surface contract focused and testable.
Snippet:
```ts
await registerGraphRoutes(app, repo);
await registerMapRoutes(app, repo);
await registerLayerRoutes(app, repo);
```

3. Use Zod schemas in `backend/src/lib/contracts.ts`.
Explanation: query validation at the boundary prevents invalid state from leaking into business logic.
Snippet:
```ts
const parsed = entitiesQuerySchema.safeParse(request.query);
if (!parsed.success) {
  return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
}
```

4. Standardize error/meta helpers in `backend/src/lib/response.ts`.
Explanation: stable response envelopes are critical for frontend consistency and future externalization.
Snippet:
```ts
export function buildSuccessMeta(layer: string, resultCount: number, warnings: string[]): SuccessMeta
```

5. Implement repository abstraction in `backend/src/lib/repository.ts`.
Explanation: this isolates data-source mechanics from HTTP behavior and keeps domain logic reusable in tests.
Snippet:
```ts
export interface Repository {
  listEntities(...): { items: Record<string, unknown>[]; totalCount: number; buckets: Record<string, unknown> };
}
```

---

## Milestone 3: Entity + Search Experience

### Why
This is the core lookup surface of a prosopographical portfolio.  
We needed:
- usable index/detail pages,
- deterministic search behavior,
- explicit unknown/ambiguous data signaling.

### How
1. Build `/entities` with MUI X DataGrid in `src/views/entitiesRoute.tsx`.
Explanation: DataGrid gives robust paging/sorting UX while keeping server-driven query semantics.
Snippet:
```ts
<DataGrid
  paginationMode="server"
  rowCount={meta.total_count ?? rows.length}
  paginationModel={{ page, pageSize }}
  onPaginationModelChange={onPaginationModelChange}
/>
```

2. Build `/entity/:id` in `src/views/entityDetailRoute.tsx`.
Explanation: detail route composes profile + linked assertions so entity context is inspectable without leaving route.
Snippet:
```ts
const entityQuery = useQuery({
  queryKey: ['entity-by-id', entityId, filters.layer],
  queryFn: () => fetchEntityById({ entityId, filters }),
});
```

3. Build `/search` in `src/views/searchRoute.tsx`.
Explanation: global search route reuses the same backend semantics and keeps exploratory entry simple.
Snippet:
```ts
const query = useQuery({
  queryKey: ['search', filters],
  queryFn: () => fetchEntities({ filters, page: 0, pageSize: 50 }),
});
```

4. Implement search semantics in repository.
Explanation: fuzzy/exact/tie-break behavior belongs in backend query logic so all UI surfaces remain coherent.
Snippet:
```ts
.sort((left, right) => {
  if (right.score !== left.score) return right.score - left.score;
  const byLabel = leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' });
  if (byLabel !== 0) return byLabel;
  return leftId.localeCompare(rightId, undefined, { sensitivity: 'base' });
});
```

5. Add hard include/exclude `rel_type`.
Explanation: this allows deterministic filtering (`ally,!enemy`) instead of soft relevance side-effects.
Snippet:
```txt
ally,!enemy
```

---

## Milestone 4: Graph Experience

### Why
Graph is a primary exploration mode in prosopography.  
Needed behavior:
- deep traversal,
- progressive expansion,
- meaningful clustering views (`View Dynasty`, `View Workplace`),
- reusable side panel pattern.

### How
1. Integrate Cytoscape in `src/views/graphRoute.tsx`.
Explanation: Cytoscape gives interaction-rich node/edge rendering without writing custom graph canvas logic.
Snippet:
```ts
const cy = cytoscape({
  container: containerRef.current,
  elements,
  layout: { name: 'cose', animate: false },
});
```

2. Extend `/api/graph/neighborhood` for seed/depth/filter/confidence.
Explanation: graph query parameters let the client drive exploration without overfetching everything by default.
Snippet:
```ts
const graph = repo.getGraphNeighborhood(layer, {
  entityId: parsed.data.entity_id,
  depth: parsed.data.depth,
  relType: parsed.data.rel_type,
});
```

3. Build shared side panel behavior.
Explanation: compact-first + expand-on-demand keeps dense graph screens readable and consistent with map UX.
Snippet:
```ts
{expanded ? <Typography>Full entity payload keys: ...</Typography> : <Typography>Compact summary mode is active.</Typography>}
```

4. Add `View Dynasty` / `View Workplace` inference modes.
Explanation: these modes project relation signals into interpretable cluster lenses for narrative exploration.
Snippet:
```ts
const clusterMap = inferClusters(query.data?.nodes ?? [], query.data?.edges ?? [], viewMode);
```

---

## Milestone 5: Map Experience

### Why
Map is not cosmetic here; it is a discovery surface tied to place-linked assertions.

Needed:
- place-first grouping,
- raw marker rendering first (not tile pipeline),
- shared panel behavior consistent with graph,
- scale-modifier controls for non-default worlds.

### How
1. Upgrade `/api/map/features` to place-first shape.
Explanation: the API now returns renderable features and grouped place semantics in one response contract.
Snippet:
```json
{
  "type": "FeatureCollection",
  "features": [...],
  "groups": [...],
  "meta": { "buckets": { "unknown_geo_assertion_count": 1 } }
}
```

2. Implement MapLibre route in `src/views/mapRoute.tsx`.
Explanation: markers provide initial geographic affordance quickly while keeping implementation lightweight.
Snippet:
```ts
mapRef.current = new maplibregl.Map({
  container: mapContainerRef.current,
  style: 'https://demotiles.maplibre.org/style.json',
  center: [23.7, 37.97],
  zoom: 2,
});
```

3. Implement shared place-first side panel.
Explanation: selecting marker/list entries reveals grouped place/entity context with compact/expanded modes.
Snippet:
```ts
const selectedGroup = query.data.groups.find((group) => group.place_key === selectedPlaceKey) ?? null;
```

4. Add scale-modifier controls.
Explanation: world radius presets/custom value let UI framing adapt to non-default planetary assumptions.
Snippet:
```ts
const scaleRadiusKm = scalePreset === 'earth' ? 6371 : scalePreset === 'yneva' ? 7020 : parsedCustom;
```

---

## Milestone 6: Layers, Diagnostics, Policy Hardening

### Why
After building major surfaces, we needed operational confidence:
- layer consistency across views,
- diagnostics for data quality,
- observability on API latency/use,
- repeatable policy checks.

### How
1. Integrate layer tools in `src/views/layersRoute.tsx`.
Explanation: this reconciles previous layer compare/changelog capabilities into the current route shell.
Snippet:
```ts
const changelogQuery = useQuery({
  queryKey: ['layer-changelog', filters.layer, compareLayer],
  queryFn: () => fetchLayerChangelog({ layer: filters.layer, base: compareLayer }),
});
```

2. Integrate diagnostics UI in `src/views/diagnosticsRoute.tsx`.
Explanation: diagnostics route exposes consistency signals and runtime metrics in one operational panel.
Snippet:
```ts
const consistencyQuery = useQuery({
  queryKey: ['diagnostics-layer-consistency', filters.layer],
  queryFn: () => fetchLayerConsistency({ layer: filters.layer }),
});
```

3. Add diagnostics endpoints.
Explanation: backend diagnostics endpoints make consistency checks machine-testable and UI-independent.
Snippet:
```txt
GET /api/diagnostics/layer-consistency
GET /api/diagnostics/metrics
```

4. Add observability hooks.
Explanation: lightweight request counters and latency aggregates provide immediate production debugging value.
Snippet:
```ts
app.addHook('onResponse', (request, reply, done) => {
  metrics.record(routeKey, elapsed);
  done();
});
```

5. Add scripted policy checks.
Explanation: converting governance checks into scripts makes them executable gates, not informal conventions.
Snippet:
```bash
npm run check:spec-adr-sync
npm run check:url-policy
npm run check:artifact-contract
npm run check:milestone6
```

---

## Milestone 7: Desktop Stable Release Gate

### Why
A "stable" claim needs a repeatable gate, not a feeling.

### How
1. Add release-gate e2e coverage in `tests/e2e/release-gate.spec.ts`.
Explanation: these tests verify restoration/share/ambiguity behavior at user level instead of only unit-level abstractions.
Snippet:
```ts
await page.goto('/entity/p1?layer=canon&rel_type=ally&q=ignored');
await expect(page.getByRole('heading', { name: 'Entity One' })).toBeVisible();
```

2. Add consolidated gate runner `scripts/release-gate-desktop-stable.mjs`.
Explanation: one command running all required checks reduces release-time human error.
Snippet:
```ts
const checks = [
  runCommand('npm', ['run', 'build']),
  runCommand('npm', ['run', 'test:unit']),
  runCommand('npm', ['run', 'test:e2e']),
  runCommand('npm', ['run', 'check:milestone6']),
];
```

3. Generate release report `docs/m7-release-gate-report.json`.
Explanation: this captures reproducible evidence (commands, timestamps, pass/fail, tails) for desktop stable.
Snippet:
```json
{
  "milestone": "milestone-7-desktop-stable-release-gate",
  "passed": true,
  "checks": [...]
}
```

4. Publish desktop release notes in `docs/RELEASE_NOTES_DESKTOP_STABLE.md`.
Explanation: release notes are the human-facing summary of what was validated and what remains intentionally deferred.
Snippet:
```txt
Tag: desktop-stable-v1.0.0
```

---

## Core Patterns You Should Carry Forward

1. Decide semantics first, then components.
2. Keep cross-view state policy centralized.
3. Put query behavior in backend/repository, not scattered in UI.
4. Surface uncertainty/ambiguity explicitly.
5. Add verification per milestone, then automate it.
