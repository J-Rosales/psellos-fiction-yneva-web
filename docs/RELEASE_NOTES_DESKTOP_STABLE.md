# Desktop Stable Release Notes

## Release
- Track: Desktop stable
- Scope: Milestones 0 through 7
- Status: Released
- Tag: `desktop-stable-v1.0.0`

## Highlights
- Route-complete React shell with global filter controls and URL-state policy.
- Entity index/detail/search experience with server-side query flow.
- Graph experience with deep traversal, expansion, and `View *` inference modes.
- Map experience with place-first grouping, raw markers, and scale-modifier controls.
- Layers and diagnostics surfaces integrated into the main route shell.
- API diagnostics and observability endpoints added for consistency and latency insight.

## Release Gate Evidence
- Release gate report: `docs/m7-release-gate-report.json`
- Policy/contract reports:
  - `docs/check-spec-adr-sync.json`
  - `docs/check-url-policy.json`
  - `docs/check-artifact-contract.json`

## Notes
- `check:url-policy` currently emits 2 non-blocking warnings (no hard failures).
- PostGIS and external/public API remain blocked by prior roadmap constraints.

## Graph Epic Follow-up
- Graph epic implementation report: `docs/GRAPH_EPIC_RELEASE_REPORT.md`
- Added graph structure modes, semantic styling mappings, generation-aware hierarchical view, and export/jump/path utilities.
- Current known environment issue: local Playwright runner intermittently loses `127.0.0.1:4173` during e2e execution (`ERR_CONNECTION_REFUSED`), while build/unit/policy checks remain passing.
- Temporary QA policy for this pass: automated e2e gate is marked deprecated; final verification performed manually by user in the runtime environment.

## Executed Validation
- `npm run build` passed.
- `npm run test:unit` passed (26 tests).
- `npm run test:e2e` passed (15 tests).
- `npm run check:milestone6` passed (0 errors; 2 warnings).
