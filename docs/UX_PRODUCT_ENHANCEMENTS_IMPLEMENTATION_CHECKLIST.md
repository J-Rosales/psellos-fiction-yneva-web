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
- [x] M1: Add global light/dark + accent theme controls.
- [x] M2: Convert Graph to full-viewport + floating overlays (minimal-first).
- [x] M3: Convert Map to full-viewport + floating overlays (minimal-first).
- [x] M4: Rebuild Overview content as portfolio-forward orientation page.

### NEXT
- [x] M5: Add diagnostics action exports useful to prosopographers/data scientists.
- [ ] M6: Manual QA pass and release gate.

### BLOCKED
- [ ] M5.4 source concentration details from assertion-level provenance shape
  - Blocker: final source/provenance field conventions are not fully stabilized in compiled assertion payloads.

---

## Milestone M0: Entities Pagination Bug Fix

### Exit criteria
- [x] Visual rows change when page-size changes.
- [x] Visual rows change when moving between pages.
- [x] URL remains canonical and shareable.
- [x] Regression tests pass.

---

## Milestone M1: Global Theme Controls (Top Title Row)

### Exit criteria
- [x] Mode and accent update globally without page reload.
- [x] Preferences persist across refresh.
- [x] Controls are keyboard and screen-reader usable.

---

## Milestone M2: Graph Full-Viewport + Floating Controls

### Tasks
- [x] Compute graph viewport height from sticky stack.
- [x] Move graph toolbar into floating top-left card.
- [x] Move node details into floating right card.
- [x] Keep minimal controls visible and advanced options collapsible.
- [x] Preserve pan/zoom interactions beneath overlays.
- [x] Add responsive behavior for narrow widths.
- [x] Add targeted tests for viewport sizing helper and keep graph tests passing.

### Exit criteria
- [x] Graph uses full available viewport under sticky bars.
- [x] Floating controls are usable and non-obstructive.
- [x] Minimal-by-default behavior works.

---

## Milestone M3: Map Full-Viewport + Floating Controls

### Tasks
- [x] Compute map viewport height with same sticky-stack formula as graph.
- [x] Move map controls into floating top-left panel.
- [x] Move place/details panel into floating right-side card.
- [x] Keep minimal-first control density.
- [x] Keep map stable on resize.
- [x] Preserve place list/details behavior.

### Exit criteria
- [x] Map is full-viewport below sticky bars.
- [x] Floating controls mirror graph UX conventions.
- [x] Map remains stable on resize/toggle events.

---

## Milestone M4: Overview Page (Portfolio-Forward)

### Tasks
- [x] Implement sections:
  - [x] What Psellos is
  - [x] How it differs from typical prosopography viewers
  - [x] How builder/web concretize entity types
- [x] Use portfolio-forward writing tone.
- [x] Add quick-start links for key routes.
- [x] Keep content read-only and free of canon inference logic.

### Exit criteria
- [x] Overview is useful as a standalone orientation entry point.
- [x] Content is scannable.
- [x] Tone matches portfolio-forward target.

---

## Milestone M5: Diagnostics Actions for Prosopographers/Data Scientists

### Implemented
- [x] M5.1 Assertion quality profile export.
- [x] M5.2 Layer drift report export.
- [x] M5.3 Temporal sparsity report export (initial scaffold + filter context).
- [ ] M5.4 Provenance concentration report export (deferred; depends on stable provenance shape).
- [ ] M5.5 Ambiguity watchlist (not yet implemented).
- [ ] M5.6 Connectivity stress checks (not yet implemented).
- [x] M5.7 Geo coverage diagnostics export.
- [x] M5.8 Reproducibility snapshot export.

### Shared requirements
- [x] Immediate in-page actions.
- [x] Machine-readable downloadable outputs.
- [x] Uses compiled artifacts surfaced by current API.

### Exit criteria
- [x] At least M5.1-M5.4 baseline implemented/deferred with reasons.
- [x] Remaining actions are explicitly tracked.

---

## Milestone M6: Integration, QA, and Documentation

### Tasks
- [x] Run full build.
- [x] Run unit/integration tests.
- [x] Add targeted tests for viewport sizing helper.
- [ ] Manual QA pass:
  - [ ] sticky bars and full-viewport behavior
  - [ ] theme controls persistence
  - [ ] graph/map overlay usability
  - [ ] diagnostics export actions

### Exit criteria
- [ ] No known blockers in core browsing/search/graph/map flows.
- [ ] Release-ready for next SHIP cycle.

---

## Final Acceptance

- [x] Entities pagination bug is fixed and regression-tested.
- [x] Top-row mode toggle + accent swatches function globally and persist.
- [x] Graph and Map are full-viewport with floating minimal-first controls.
- [x] Overview is portfolio-forward and explanatory.
- [ ] Diagnostics page includes full target set of expert-facing actions (partial complete; deferred items tracked).
- [ ] Manual QA release gate complete.
