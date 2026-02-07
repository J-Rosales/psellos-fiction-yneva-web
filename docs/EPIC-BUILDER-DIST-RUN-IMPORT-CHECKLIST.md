# Builder Dist-Run Import Epic Checklist (Yneva)

This checklist defines the full implementation plan for consuming builder dist-run bundles into `public/data/` for `psellos-fiction-yneva-web`.

## Decisions Locked (A/B)

1. Single dist-run path per execution (`A`)
2. Missing optional dirs fail only in strict mode (`B`)
3. Missing required dirs always fail (`A`)
4. Support `.yml` and `.yaml` (`B`)
5. Keep documented predicate fallback order (`A`)
6. Missing subject/object: keep placeholder IDs and report (`B`)
7. Preserve unknown narrative fields under narrative extension (`A`)
8. Keep full raw payload (`A`)
9. Duplicate score ties keep first deterministic encounter (`A`)
10. Information-score weights configurable via external file (`B`)
11. Duplicate conflict report: separate file plus summary (`B`)
12. Conflict report detail includes full kept/discarded rows (`A`)
13. Narrative layer selection based on linked assertion id context (`A`)
14. Exclude narrative rows from `assertions_by_person*` for now (`B`)
15. Include narrative rows by default when layer matches (`A`)
16. Assertion class name: `narrative_layer` (`A`)
17. Allow temporary additive contract movement; freeze later (`A`)
18. No new narrative stats artifact yet; report-only (`B`)
19. Manifest includes importer/source metadata (`A`)
20. Stable sort only on externally consumed artifacts (`B`)
21. `--strict` enforces required files + schema checks (`A`)
22. `--dry-run` writes report only, no artifacts (`A`)
23. Output write strategy clears target first (`A`)
24. Automatic timestamped backup before write (`B`)
25. Fixture strategy: small synthetic fixtures (`A`)
26. Deterministic hash check on critical files only (`B`)
27. Runtime gate includes backend/unit/ingest/API smoke (`A`)
28. E2E policy: re-enable after local stability fix (`B`)
29. Warning policy: unlimited warnings (`A`)
30. Reporting mode: single detailed report always (`A`)

## Scope

In scope:
- Dist-run import adapter script and normalization pipeline.
- Narrative-layer first-pass integration with explicit class marker.
- Duplicate resolution via information-score policy and conflict reporting.
- Runtime artifact generation for existing web surfaces.
- Validation checks, test fixtures, deterministic output checks, and runtime compatibility verification.

Out of scope:
- Canonical authority changes.
- Runtime consumption of raw YAML/spec files.
- Final contract freeze (performed after importer pipeline is complete and verified).

---

## Milestone D0: Baseline and Contracts

- [x] Confirm required source layout assumptions for import adapter:
  - [x] required: `machine/`, `entities/`
  - [x] optional: `indexes/`, `reports/`, `narrative_layer_assertions.yml`
- [x] Confirm current web-consumed artifact contract list:
  - [x] `manifest.json`
  - [x] `persons.json`
  - [x] `assertions.json`
  - [x] `assertions_by_id.json`
  - [x] `assertions_by_layer.json`
  - [x] `assertions_by_person.json`
  - [x] `assertions_by_person_by_layer.json`
  - [x] `layers.json`
  - [x] optional `layer_stats.json`, `layers_meta.json`
- [x] Add implementation note: additive fields are allowed during importer landing; freeze later.

### Exit criteria
- [x] Source/target contract assumptions documented and unambiguous.

### Verification log (D0)
- Notes:
  - Baseline confirmed against `README.md`, `backend/src/lib/repository.ts`, and loader files in `src/data/*`.
  - Additive-field allowance retained during importer landing phase.
- Contract snapshot:
  - Target runtime files: `manifest.json`, `persons.json`, `assertions.json`, `assertions_by_id.json`, `assertions_by_layer.json`, `assertions_by_person.json`, `assertions_by_person_by_layer.json`, `layers.json`.
  - Optional runtime files remain supported: `layer_stats.json`, `layers_meta.json`.

---

## Milestone D1: Import Adapter CLI

- [x] Add `scripts/import-builder-dist-run.mjs`.
- [x] Add CLI options:
  - [x] `--dist-run <path>` (required)
  - [x] `--out <path>` (default `public/data`)
  - [x] `--strict`
  - [x] `--dry-run`
  - [x] `--report <path>`
  - [x] `--score-config <path>` (external scoring weights)
- [x] Implement extension handling for entity files:
  - [x] `.yml`
  - [x] `.yaml`
- [x] Required-layout enforcement:
  - [x] fail when required dirs missing
  - [x] optional dirs warn unless strict mode
- [x] Add write-mode safeguards:
  - [x] timestamped backup before write
  - [x] clear output target before write
  - [x] skip all writes in dry-run mode

### Exit criteria
- [x] CLI works end-to-end and enforces required/optional policies correctly.

### Verification log (D1)
- Commands run:
  - `node scripts/import-builder-dist-run.mjs --dist-run .tmp/dist-run-d1 --dry-run --report docs/d1-import-report.json`
  - `node scripts/import-builder-dist-run.mjs --dist-run .tmp/dist-run-d1-full --out .tmp/out-d1 --report docs/d1-import-report-apply.json`
- Strict-mode checks:
  - `node scripts/import-builder-dist-run.mjs --dist-run .tmp/dist-run-d1 --strict --dry-run --report docs/d1-import-report-strict.json` failed as expected on missing optional dirs.
- Dry-run checks:
  - Dry-run writes report only and performs no output mutation.

---

## Milestone D2: Entity Registry Mapping (`persons.json`)

- [x] Build persons registry from `machine/*.canonical.json` excluding assertions canonical file.
- [x] Implement deterministic primary-type precedence:
  - [x] persons > groups > polities > institutions > offices > places > artifacts > texts > sources > species
- [x] Emit fields:
  - [x] `id`
  - [x] `qid`
  - [x] `label`
  - [x] `entity_type`
  - [x] `entity_types`
  - [x] `source_entity_ids` when available

### Exit criteria
- [x] `persons.json` deterministic and populated from machine canonical artifacts.

### Verification log (D2)
- Count:
  - Fixture run produced deterministic keyed `persons.json` with expected count.
- Conflict/type-resolution notes:
  - Primary type resolved via fixed precedence list in importer script.

---

## Milestone D3: Assertion Core Mapping (`assertions_by_id.json`, `assertions.json`)

- [x] Source preference logic:
  - [x] use `indexes/assertions_by_id.json` when non-empty
  - [x] fallback parse from `entities/**/*.yml|yaml`
- [x] Normalize assertion fields:
  - [x] `id`
  - [x] `subject` (placeholder when missing)
  - [x] `object` (placeholder when missing)
  - [x] `predicate` via fallback order:
    - [x] `relation_mapped`
    - [x] `predicate_pid`
    - [x] `predicate_hint`
    - [x] `related_to`
  - [x] `extensions.psellos.rel`
  - [x] `extensions.psellos.layer`
  - [x] `extensions.psellos.source`
  - [x] `extensions.psellos.raw` full payload
- [x] Emit `assertions.json` as sorted values of by-id map.

### Exit criteria
- [x] Normalized assertions generated deterministically and complete enough for runtime queries.

### Verification log (D3)
- Assertion count:
  - Fixture import generated expected normalized assertion rows in both `assertions_by_id.json` and `assertions.json`.
- Missing subject/object placeholder count:
  - Placeholder path is implemented and warning-backed; zero placeholders in fixture verification run.

---

## Milestone D4: Duplicate Resolution and Reporting

- [x] Implement info-score resolution for duplicate assertion IDs.
- [x] Load scoring weights from external config file.
- [x] Tie-break rule: keep first deterministic encounter.
- [x] Emit separate conflict report file with full kept/discarded rows.
- [x] Emit conflict summary in main import report.

### Exit criteria
- [x] Duplicate conflicts resolved deterministically with traceable report output.

### Verification log (D4)
- Conflict count:
  - Fixture run produced `1` conflict id and `1` discarded row with score rationale.
- Conflict report path:
  - `<report>.conflicts.json` (verified via `docs/d4-import-report.conflicts.json`).

---

## Milestone D5: Narrative-Layer First Pass Integration

- [x] Parse `narrative_layer_assertions.yml` when present.
- [x] Normalize narrative rows with class marker:
  - [x] `extensions.psellos.assertion_class = "narrative_layer"`
  - [x] preserve full raw row
  - [x] preserve narrative fields under `extensions.psellos.narrative`
- [x] Layer association policy:
  - [x] derive narrative layer from linked assertion id context
- [x] Include narrative rows in:
  - [x] `assertions_by_id.json`
  - [x] `assertions.json`
  - [x] `assertions_by_layer.json`
  - [x] `layers.json`
- [x] Exclude narrative rows from:
  - [x] `assertions_by_person.json`
  - [x] `assertions_by_person_by_layer.json`

### Exit criteria
- [x] Narrative-layer rows are ingestible, typed, queryable by layer, and visibly preserved.

### Verification log (D5)
- Narrative detected:
  - Fixture run detected `narrative_layer_assertions.yml` and applied merge.
- Narrative rows emitted:
  - Narrative rows emitted into `assertions_by_id`/`assertions` with class marker.
- Exclusion checks (`assertions_by_person*`):
  - Narrative rows excluded from person indexes while canonical rows remain indexed.

---

## Milestone D6: Layer/Person Index Artifacts

- [ ] Build `assertions_by_layer.json` from normalized assertions.
- [ ] Build `layers.json` from `assertions_by_layer` keys.
- [ ] Build `assertions_by_person.json` from canonical-class rows only.
- [ ] Build `assertions_by_person_by_layer.json` from canonical-class rows only.
- [ ] Ensure sorted deterministic IDs and keys for externally consumed artifacts.

### Exit criteria
- [ ] Layer/person indexes are deterministic and runtime compatible.

### Verification log (D6)
- Layers count:
  - (pending milestone completion)
- Canon layer present:
  - (pending milestone completion)

---

## Milestone D7: Manifest and Metadata

- [ ] Generate `manifest.json` with:
  - [ ] `spec_version`
  - [ ] `builder_version`
  - [ ] `counts.persons`
  - [ ] `counts.assertions`
  - [ ] `person_index`
  - [ ] `source_dist_run`
  - [ ] `source_generated_at`
  - [ ] `imported_at`
- [ ] Include narrative import metadata in main report:
  - [ ] detected flag
  - [ ] row count
  - [ ] merge applied flag
  - [ ] rows emitted

### Exit criteria
- [ ] Manifest and report metadata sufficient for provenance and runtime diagnostics.

### Verification log (D7)
- Manifest path:
- Report path:

---

## Milestone D8: Validation and Guardrails

- [ ] Add/extend checks:
  - [ ] deterministic ordering on externally consumed artifacts
  - [ ] no duplicate IDs in final by-id map
  - [ ] `assertions_by_layer` IDs subset of `assertions_by_id`
  - [ ] `assertions_by_person` IDs subset of `assertions_by_id`
- [ ] Add critical-file deterministic hash regression check:
  - [ ] `persons.json`
  - [ ] `assertions_by_id.json`
  - [ ] `assertions_by_layer.json`
  - [ ] `layers.json`
  - [ ] `manifest.json`

### Exit criteria
- [ ] Contract guardrails catch structural drift and nondeterminism.

### Verification log (D8)
- Guardrail results:
- Hash regression results:

---

## Milestone D9: Tests

- [ ] Add script-level tests with small synthetic fixtures:
  - [ ] basic import success
  - [ ] YAML fallback normalization
  - [ ] duplicate conflict resolution
  - [ ] score winner selection
  - [ ] narrative class/layer mapping
- [ ] Add repository integration test:
  - [ ] generated output readable by `ArtifactRepository`
- [ ] Add regression test around deterministic output for fixed fixture.

### Exit criteria
- [ ] Importer behavior covered by deterministic automated tests.

### Verification log (D9)
- Test files:
- Test run summary:

---

## Milestone D10: Runtime Compatibility Gate

- [ ] Run importer on target dist-run.
- [ ] Run runtime compatibility gate:
  - [ ] backend tests pass with generated artifacts
  - [ ] frontend unit tests pass with generated artifacts
  - [ ] `npm run ingest:dry -- --data-dir public/data`
  - [ ] API smoke:
    - [ ] `/api/assertions?layer=canon` non-empty
    - [ ] `/api/layers` non-empty
- [ ] E2E policy:
  - [ ] mark as pending re-enable after environment stability fix

### Exit criteria
- [ ] Runtime reads generated artifacts without contract-breaking regressions.

### Verification log (D10)
- Import command:
- Gate command results:
- API smoke notes:

---

## Milestone D11: Documentation and Freeze Decision

- [ ] Publish importer usage docs and examples.
- [ ] Publish duplicate conflict report schema.
- [ ] Publish narrative first-pass semantics note.
- [ ] Decide contract freeze point after successful gate.
- [ ] Add release note entry for importer pipeline milestone.

### Exit criteria
- [ ] Team can run importer and understand semantics without code-reading.

### Verification log (D11)
- Docs updated:
- Freeze decision note:

---

## Acceptance Criteria

For a run equivalent to `20260206-234206`:
- [ ] `public/data/persons.json` exists and has at least 224 entries.
- [ ] `public/data/assertions_by_id.json` exists and has at least 1091 entries.
- [ ] `public/data/assertions.json` count equals by-id count.
- [ ] `public/data/assertions_by_layer.json` non-empty and includes `canon` plus detected narrative layers.
- [ ] `public/data/layers.json` includes at least one layer.
- [ ] Backend `/api/assertions` returns non-empty for `layer=canon`.
- [ ] Backend `/api/layers` returns non-empty.
- [ ] Frontend manifest view renders counts without loader errors.
- [ ] Duplicate conflict report generated when conflicts exist.

## Notes

- This repository remains a read-only consumer of compiled artifacts.
- Runtime must not read upstream raw YAML/spec files directly.
- Transformation logic lives at import/build time.
- Unknown fields should be preserved under extension raw payload where feasible.
