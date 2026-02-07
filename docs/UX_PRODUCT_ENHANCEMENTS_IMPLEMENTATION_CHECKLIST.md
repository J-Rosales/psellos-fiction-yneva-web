# UX/Product Enhancements Implementation Checklist

This checklist turns `docs/DRAFT-UX_PRODUCT_ENHANCEMENTS.md` into an executable milestone plan.

## Locked Decisions (from A/B)

1. Overview tone: `B` Portfolio-forward prose.
2. Full-viewport overlays default density: `A` Minimal controls shown, expandable.
3. Diagnostics action exposure: `A` Immediate in-page action buttons.
4. Theme presets governance: `A` Fixed curated palette.

---

## NOW / NEXT / BLOCKED

### NOW
- [x] M0: Fix Entities pagination correctness bug.
- [ ] M1: Add global light/dark + accent theme controls.

### NEXT
- [ ] M2: Convert Graph to full-viewport + floating overlays (minimal-first).
- [ ] M3: Convert Map to full-viewport + floating overlays (minimal-first).
- [ ] M4: Rebuild Overview content as portfolio-forward orientation page.

### BLOCKED
- [ ] M5.8 (optional): Advanced diagnostics visualizations requiring unresolved data-shape gaps.
  - Blocker: confirm final date/provenance field conventions across all assertion classes.

---

## Milestone M0: Entities Pagination Bug Fix

### Scope
- Repair Entities page paging and page-size controls so they always update results and URL state.

### Tasks
- [x] Reproduce and capture current failure path.
- [x] Audit DataGrid controlled props (`page`, `pageSize`, `rowCount`) and event handlers.
- [x] Ensure URL query params update on:
  - [x] page change
  - [x] rows-per-page change
- [x] Ensure React Query key includes page/page_size and refetches on each change.
- [x] Ensure API request sends `page` and `page_size` values.
- [x] Add regression test(s) for:
  - [x] changing rows-per-page
  - [x] next/prev page navigation

### Exit criteria
- [x] Visual rows change when page-size changes.
- [x] Visual rows change when moving between pages.
- [x] URL remains canonical and shareable.
- [x] Regression tests pass.

### Verification log (M0)
- Files:
  - `src/views/entitiesRoute.tsx`
  - `src/views/entitiesPagination.ts`
  - `src/views/entitiesRoute.test.ts`
- Commands:
  - `npm run test:unit -- src/views/entitiesRoute.test.ts`
  - `npm run test:unit`
- Notes:
  - Enabled explicit DataGrid pagination mode and normalized pagination URL param updates.
  - Page resets to `0` when page-size changes to avoid stale high-page empty windows.

---

## Milestone M1: Global Theme Controls (Top Title Row)

### Scope
- Add mode toggle + fixed accent swatches in top-right title row using MUI theming.

### Tasks
- [ ] Add theme state model (`mode`, `accentId`) in top-level UI state.
- [ ] Extend MUI theme generation to derive palette from selected accent + mode.
- [ ] Add icon-only mode toggle:
  - [ ] sun icon in light mode
  - [ ] moon icon in dark mode
- [ ] Add fixed accent swatch buttons (circular):
  - [ ] dark pink
  - [ ] aquamarine
  - [ ] golden
  - [ ] one neutral fallback accent
- [ ] Add persistence:
  - [ ] load saved mode/accent from local storage
  - [ ] save on change
- [ ] Add a11y:
  - [ ] tooltip + aria-label on every theme control
  - [ ] visible focus styles
  - [ ] contrast check for selected accent in both modes

### Exit criteria
- [ ] Mode and accent update globally without page reload.
- [ ] Preferences persist across refresh.
- [ ] Controls are keyboard and screen-reader usable.

---

## Milestone M2: Graph Full-Viewport + Floating Controls

### Scope
- Make graph canvas immersive under sticky bars; controls/details float above it.

### Tasks
- [ ] Compute graph viewport height from sticky stack:
  - [ ] `100vh - top navbar - filter strip`
- [ ] Move graph toolbar into floating `Paper/Card` (top-left).
- [ ] Move node details into floating `Paper/Card` (right).
- [ ] Default to minimal control density:
  - [ ] core controls visible
  - [ ] advanced controls collapsed/expandable
- [ ] Preserve interaction:
  - [ ] no forced page scroll for core usage
  - [ ] pan/zoom not blocked by overlays
- [ ] Add responsive behavior:
  - [ ] stack overlays on narrow widths
  - [ ] avoid blocking center viewport
- [ ] Add tests:
  - [ ] route renders graph viewport container with expected class/state
  - [ ] expand/collapse states function

### Exit criteria
- [ ] Graph uses full available viewport under sticky bars.
- [ ] Floating controls are usable and non-obstructive.
- [ ] Minimal-by-default behavior works.

---

## Milestone M3: Map Full-Viewport + Floating Controls

### Scope
- Mirror graph interaction model on map page.

### Tasks
- [ ] Compute map viewport height with same sticky-stack formula as graph.
- [ ] Move map controls into floating top-left panel.
- [ ] Move place/details panel into floating right-side card.
- [ ] Keep minimal-first control density with expansion.
- [ ] Ensure map resize/reflow correctness on:
  - [ ] window resize
  - [ ] filter strip expand/collapse
- [ ] Ensure non-geocoded groups still visible in detail panel/list.
- [ ] Add tests:
  - [ ] map viewport render
  - [ ] floating panel visibility toggles

### Exit criteria
- [ ] Map is full-viewport below sticky bars.
- [ ] Floating controls mirror graph UX conventions.
- [ ] Map remains stable on resize/toggle events.

---

## Milestone M4: Overview Page (Portfolio-Forward)

### Scope
- Replace current placeholder with curated content sections.

### Tasks
- [ ] Implement Overview sections:
  - [ ] What Psellos is
  - [ ] How this differs from typical prosopography approaches
  - [ ] How builder/web concretize canonical entity types
- [ ] Use portfolio-forward writing tone (`B` decision).
- [ ] Add links to key docs:
  - [ ] importer guide
  - [ ] stack baseline
  - [ ] artifact contract references
- [ ] Add visual structure:
  - [ ] section cards or anchored content blocks
  - [ ] quick “where to start” action links
- [ ] Verify no canon inference/business logic added.

### Exit criteria
- [ ] Overview is useful as a standalone orientation entry point.
- [ ] Content is scannable and source-linked.
- [ ] Tone matches portfolio-forward target.

---

## Milestone M5: Diagnostics Actions for Prosopographers/Data Scientists

### Scope
- Add immediate action buttons and exportable diagnostics not duplicated elsewhere.

### M5.1 Assertion quality profile export
- [ ] Add action button.
- [ ] Export JSON report: missing labels, unknown endpoints, low-confidence counts.

### M5.2 Layer drift report
- [ ] Add action button.
- [ ] Export per-layer relation/entity composition deltas.

### M5.3 Temporal sparsity report
- [ ] Add action button.
- [ ] Export date-coverage gaps by layer/relation type.

### M5.4 Provenance concentration report
- [ ] Add action button.
- [ ] Export source concentration metrics and top-source distribution.

### M5.5 Ambiguity watchlist
- [ ] Add action button.
- [ ] Export repeated-label/alias collision candidates.

### M5.6 Connectivity stress checks
- [ ] Add action button.
- [ ] Export disconnected components and high-degree hubs.

### M5.7 Geo coverage diagnostics
- [ ] Add action button.
- [ ] Export geocoded vs non-geocoded ratio by layer/rel_type.

### M5.8 Reproducibility snapshot
- [ ] Add action button.
- [ ] Export current counts + artifact hashes for run comparison.

### Shared requirements
- [ ] All actions are immediate in-page controls (`A` decision).
- [ ] All outputs are machine-readable and downloadable.
- [ ] Outputs trace to current compiled artifacts only.

### Exit criteria
- [ ] At least M5.1–M5.4 implemented with tested exports.
- [ ] Remaining actions implemented or explicitly deferred with reasons.

---

## Milestone M6: Integration, QA, and Documentation

### Tasks
- [ ] Run full build.
- [ ] Run unit/integration tests.
- [ ] Add targeted tests for M0–M5 features.
- [ ] Manual QA pass:
  - [ ] sticky bars and full-viewport behavior
  - [ ] theme controls persistence
  - [ ] graph/map overlay usability
  - [ ] diagnostics export actions
- [ ] Update documentation:
  - [ ] Overview references
  - [ ] UI behavior notes
  - [ ] diagnostics action index

### Exit criteria
- [ ] No known blockers in core browsing/search/graph/map flows.
- [ ] New controls/features are documented.
- [ ] Release-ready for next SHIP cycle.

---

## Final Acceptance

- [ ] Entities pagination bug is fixed and regression-tested.
- [ ] Top-row mode toggle + accent swatches function globally and persist.
- [ ] Graph and Map are full-viewport with floating minimal-first controls.
- [ ] Overview is portfolio-forward and explanatory.
- [ ] Diagnostics page includes meaningful expert-facing action exports.
- [ ] Build/tests pass and docs are updated.
