# Psellos Fiction Yneva Web

Psellos Fiction Yneva Web is a static, read-only web application for exploring compiled prosopographical data produced by `psellos-builder`, with a presentation focus on the `psellos-fiction-yneva-data` dataset. The site focuses on presenting entities, relationships, and narratives derived from builder outputs, without embedding or editing source data.

## Project Context

This repo is derived from `psellos-web` and remains part of the broader `psellos-hub` ecosystem. It exists to visualize published artifacts generated elsewhere.

## Upstream references

- Governance authority: `https://github.com/psellos-prosopographia/psellos-hub`
- Workspace authority index: `https://raw.githubusercontent.com/psellos-prosopographia/psellos-hub/main/AUTHORITY_INDEX.yml`
- Primary source dataset for this presentation app: `https://github.com/psellos-prosopographia/psellos-fiction-yneva-data`
- Spec contracts: `https://github.com/psellos-prosopographia/psellos-spec`
- Artifact compiler: `https://github.com/psellos-prosopographia/psellos-builder`
- Minimal reference web app baseline: `https://github.com/psellos-prosopographia/psellos-web`

## Working in this repo alone

If this repository is opened as a standalone workspace, treat the links above as authoritative references for cross-repo governance, data provenance, and build contracts. This repository remains presentation-only and artifact-consumer-only.

## Purpose

- Provide a lightweight, static UI for browsing compiled prosopographical artifacts.
- Keep the application read-only and decoupled from raw datasets.
- Emphasize integration points for future visualizations (encyclopedia, relationship graph, narrative layers).

## Data flow from psellos-builder

1. `psellos-builder` compiles raw sources into publishable JSON artifacts.
2. Those build artifacts are copied into `public/data/` as static assets.
3. The Vite build emits a static site that fetches the JSON at runtime via `fetch()`.

The app does **not** read or transform raw data directly. It only consumes builder output and assumes those artifacts have already been validated upstream.

## Separation from canon and schema

- **Canon**: The canonical source data remains entirely within `psellos-builder` (or its upstream sources).
- **Schema**: The data contracts are defined by the builder and imported here as *assumptions*.
- **Web**: This repo only visualizes compiled JSON and should not define or enforce canonical schemas.

Where contracts are assumed, TODOs call out the expected builder artifacts so the two systems can be aligned.

## M2b artifact requirements

For the M2b slice, Psellos Fiction Yneva Web expects the following artifacts under `public/data/`, copied from `psellos-builder/dist/`:

- `manifest.json`
- `persons.json`
- `assertions.json`

The UI reads the following fields from the manifest:

- `spec_version` (string)
- `counts.persons` (number)
- `counts.assertions` (number)
- `person_index` (object mapping person id ➜ display name)

Additional fields are ignored so the UI can remain forward-compatible with future manifest expansions.

The UI also reads the following minimal fields from M2b artifacts:

- `persons.json`: object mapping person id ➜ record object (each record must include `id`; if `type` is present it must be a string). Name display prefers `name`, then `label`.
- `assertions.json`: array of assertion objects (each must include `predicate`, `subject`, and `object`). Optional time range fields such as `start`, `end`, `start_date`, or `end_date` are displayed when present.

Additional fields are ignored so the UI can remain forward-compatible with future artifact expansions.

## M2c artifact requirements

For the M2c slice, Psellos Fiction Yneva Web expects the following additional adjacency artifacts under
`public/data/`, copied from `psellos-builder/dist/`:

- `assertions_by_person.json` (object mapping person id ➜ array of assertion ids)
- `assertions_by_id.json` (object mapping assertion id ➜ assertion object)

Person detail views use the adjacency index to resolve related assertions and no longer scan
the full assertions list. Additional fields are ignored so the UI can remain forward-compatible
with future artifact expansions.

## Development

```bash
npm install
npm run dev
```

### API and ingest utilities (Milestone 2)

```bash
# Start read-only API skeleton
npm run api:dev

# Generate ingest report from compiled artifacts
npm run ingest:dry -- --report docs/m2-ingest-report.json

# Apply ingest to PostgreSQL (requires DATABASE_URL)
npm run ingest:apply
```

### Policy and diagnostics checks (Milestone 6)

```bash
# Run all policy hardening checks used by Milestone 6
npm run check:milestone6

# Individual checks
npm run check:spec-adr-sync
npm run check:url-policy
npm run check:artifact-contract
```

Reports are written to:
- `docs/check-spec-adr-sync.json`
- `docs/check-url-policy.json`
- `docs/check-artifact-contract.json`

## Current stack baseline

- React + TypeScript + Vite
- MUI (`@mui/material`, `@mui/lab`, `@mui/icons-material`) + MUI X (`@mui/x-data-grid`, `@mui/x-date-pickers`, `@mui/x-charts`)
- TanStack Router + TanStack Query
- Cytoscape.js (graph) + MapLibre GL JS (map)
- Fastify + Zod + PostgreSQL client (`pg`) for planned read-only API/index layer

### Static asset pipeline

- Vite serves `public/` as static assets.
- JSON artifacts from `psellos-builder` should be placed under `public/data/`.
- The data loader fetches these artifacts at runtime.
