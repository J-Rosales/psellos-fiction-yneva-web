# Builder Dist-Run Importer Guide

This document defines how to run and interpret the importer pipeline implemented in `scripts/import-builder-dist-run.mjs`.

## Purpose

- Consume compiled builder dist-run artifacts.
- Normalize and emit runtime JSON artifacts for this web repository under `public/data/`.
- Preserve forward-compatible payloads under `extensions.psellos.raw` and `extensions.psellos.narrative`.

## CLI

Command:

```bash
node scripts/import-builder-dist-run.mjs --dist-run <path> [options]
```

Options:

- `--dist-run <path>`: required source folder.
- `--out <path>`: output folder (default `public/data`).
- `--strict`: fail on missing optional dist-run entries.
- `--dry-run`: generate report only, skip artifact writes.
- `--report <path>`: report output (default `docs/dist-run-import-report.json`).
- `--score-config <path>`: external duplicate-score weights JSON.

## Canonical Dist-Run Inbox

Use the repository handoff folder as default source:

- `builder-dist-run/`

Convenience commands:

```bash
npm run import:dry
npm run import:apply
```

These commands are pre-wired to:

- `--dist-run builder-dist-run`
- `--out public/data`
- report path `docs/importer-inbox-report.json`

## Required and Optional Source Layout

Required:

- `machine/`
- `entities/`

Optional:

- `indexes/`
- `reports/`
- `narrative_layer_assertions.yml`

## Output Artifacts

Generated:

- `manifest.json`
- `persons.json`
- `assertions_by_id.json`
- `assertions.json`
- `assertions_by_layer.json`
- `layers.json`
- `assertions_by_person.json`
- `assertions_by_person_by_layer.json`

## Duplicate Resolution Policy

- Duplicates are grouped by assertion id.
- Winner is selected by highest information score.
- Score weights are configurable via `--score-config`.
- Score ties retain first deterministic encounter.

Conflict reporting:

- Main report includes `duplicate_conflict_summary`.
- Full conflict payload is emitted to `<report>.conflicts.json` with:
  - `id`
  - `winner_score`
  - `winner`
  - `discarded[]` (row + score)

## Narrative First-Pass Semantics

- If present, `narrative_layer_assertions.yml` is parsed and merged.
- Narrative rows are emitted with:
  - `extensions.psellos.assertion_class = "narrative_layer"`
  - `extensions.psellos.narrative` (full narrative payload)
  - `extensions.psellos.raw` (full row payload)
- Narrative rows are included in:
  - `assertions_by_id.json`
  - `assertions.json`
  - `assertions_by_layer.json`
  - `layers.json`
- Narrative rows are excluded from:
  - `assertions_by_person.json`
  - `assertions_by_person_by_layer.json`

## Validation Guardrails

Importer report includes:

- `guardrails`:
  - duplicate-id check
  - subset checks from layer/person indexes into by-id map
  - deterministic ordering checks for layer/person arrays
- `critical_hashes`:
  - `persons.json`
  - `assertions_by_id.json`
  - `assertions_by_layer.json`
  - `layers.json`
  - `manifest.json`

## Freeze Decision

Contract status: `frozen for importer v1`.

Meaning:

- The importer output keyset and baseline semantics listed in this document are now considered stable for runtime consumers.
- New fields remain additive-only and must not remove or redefine existing keys without a new ADR and migration note.
- Narrative first-pass behavior remains stable at current scope (typed merge + exclusion from person indexes).

