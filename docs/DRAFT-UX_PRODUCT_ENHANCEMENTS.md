# Draft UX/Product Enhancements

This draft structures the current broad ideas into concrete, reviewable implementation tracks.

## 1) Overview Page Content Architecture

### Goal
Turn Overview into a clear orientation layer for newcomers and domain experts.

### Proposed section layout
1. What Psellos is  
- One concise section describing Psellos as a compiled-artifact prosopographical ecosystem with clear separation of concerns (source/build/web).

2. How this differs from typical prosopographical approaches  
- Focus on pipeline-driven, contract-based, read-only web consumption.
- Contrast with ad hoc spreadsheet/manual curation web stacks.

3. How `yneva-builder` and `yneva-web` concretize entity types  
- Explain canonical type families and why the web relies on compiled machine artifacts.
- Clarify type visibility in search, entity cards, graph/map semantics.

### Acceptance criteria
- Overview is readable without prior repo context.
- Sections are scannable and include direct links to relevant docs.
- No canon logic is introduced in web; explanatory only.

---

## 2) Full-Viewport Visualization Surfaces (Graph + Map)

### Goal
Use the entire available viewport below sticky top bars for immersive visual exploration.

### Graph page proposal
- Graph canvas fills remaining viewport height and width.
- Toolbar becomes floating (top-left style control block).
- Node details panel becomes floating (right-side inspector card).
- Interactions resemble map tooling patterns: pan/zoom first, details second.

### Map page proposal
- Same interaction model as graph:
  - full-viewport map surface below sticky bars,
  - floating toolbar,
  - floating place/details panel.

### Implementation direction
- Compute viewport container height as `calc(100vh - stickyHeaderHeight - stickyFilterHeight)`.
- Convert current in-flow controls into absolutely-positioned overlays with `Paper/Card` containers.
- Keep keyboard and focus behavior accessible (tab order + aria labels).

### Acceptance criteria
- No vertical clipping or forced page scroll for primary surface.
- Floating controls do not block critical center viewport.
- Works at common desktop resolutions and mobile breakpoints (even if mobile is limited feature mode).

---

## 3) Diagnostics Page: New Action Ideas

### Goal
Add diagnostics actions specifically useful for prosopographers and historical data scientists.

### Candidate actions (not covered by other pages)
1. Assertion quality profile export  
- Export distribution of missing labels, unknown endpoints, low-confidence edges.

2. Layer drift report  
- Show per-layer changes in relation-type composition and entity-type participation.

3. Temporal sparsity heatmap action  
- Highlight date coverage gaps by layer and relation type.

4. Provenance concentration view  
- Which sources dominate each relation class and where source bias appears.

5. Ambiguity watchlist  
- List entities with high alias collision / repeated same-label ambiguity.

6. Connectivity stress checks  
- Identify isolated components and unexpectedly dense hubs per layer.

7. Geo coverage diagnostics  
- Ratio of geocoded vs non-geocoded assertions by layer/relation type.

8. Reproducibility snapshot  
- Export hash + counts summary for quick run-to-run consistency comparison.

### Acceptance criteria
- Each action provides exportable machine-readable output.
- Outputs are traceable to existing artifacts and do not invent canon logic.

---

## 4) Entities Pagination Bug (Known Issue)

### Reported behavior
- In Entities page, changing “rows per page” or clicking pagination controls does not update shown results.

### Likely fault domain
- Query-state sync between URL params and table pagination model.
- Potential mismatch between `page/page_size` state and DataGrid controlled props/events.

### Fix track
1. Reproduce with deterministic steps.
2. Verify URL updates and query key invalidation.
3. Ensure backend receives updated `page` and `page_size`.
4. Add regression unit/integration test for pagination transitions.

### Acceptance criteria
- Rows/page and page navigation both trigger data refresh and visible row changes.
- URL remains canonical and shareable.

---

## 5) Global Theme Controls in Top Title Row

### Goal
Add lightweight appearance controls in the title row (top-right anchored).

### Required controls
1. Light/Dark toggle icon button  
- Sun icon in light mode, moon icon in dark mode.
- Single icon button (not a pill/toggle chip).

2. Accent swatches (small circular buttons)  
- Example accents: dark pink, aquamarine, golden.
- One-click accent change while preserving theme mode.

### MUI implementation direction
- Use MUI theme mode state + palette augmentation.
- Keep `ThemeProvider` dynamic with controlled mode/accent state.
- Persist user preference in local storage.

### Accessibility requirements
- All icon/swatch buttons need tooltips + aria labels.
- Visible focus ring and sufficient contrast in both modes.

### Acceptance criteria
- Mode and accent changes apply globally without reload.
- Preferences persist across sessions.

---

## 6) Suggested Rollout Order

1. Fix Entities pagination bug (correctness blocker).  
2. Implement global theme controls (cross-cutting UI foundation).  
3. Convert graph/map to full-viewport + floating controls.  
4. Expand Overview content architecture.  
5. Add diagnostics action set incrementally.

---

## Open Questions (A/B)

1. Overview tone  
B) Portfolio-forward prose

2. Full-viewport overlays default density  
A) Minimal controls shown, expandable  

3. Diagnostics action exposure  
A) Immediate in-page action buttons  

4. Theme presets governance  
A) Fixed curated palette  
