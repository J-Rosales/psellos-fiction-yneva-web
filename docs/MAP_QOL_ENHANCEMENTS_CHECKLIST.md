# Map QoL Enhancements Implementation Checklist

This checklist implements the full Map quality-of-life pass for navigation, rendering scalability, accessibility, and analyst workflow speed.

## Milestone 1 - Navigation and Camera UX

- [x] Add explicit camera controls (`fit`, `zoom in`, `zoom out`, `reset bearing/pitch`).
- [x] Sync list selection with map camera (`flyTo` selected place).
- [x] Add robust `fit to results` behavior with safe fallback center/zoom.
- [x] Improve marker click behavior to reliably select corresponding place in the side panel.
- [x] Add clear status chips for result count and unknown/ambiguous geo buckets.

## Milestone 2 - Scalable Rendering and Density Modes

- [ ] Replace per-marker rendering with map source/layer rendering.
- [ ] Add cluster rendering mode for dense datasets (cluster circles + count labels).
- [ ] Add non-cluster point rendering mode for direct inspection.
- [ ] Add heatmap mode for density exploration.
- [ ] Add runtime mode switch without page reload.

## Milestone 3 - Interaction Quality and Accessibility

- [ ] Add keyboard-safe list-first interaction model as full map alternative.
- [ ] Improve map click affordances (cursor changes, click targets, clear visual states).
- [ ] Add map interaction hint text and robust empty-state handling.
- [ ] Ensure selected place details stay stable when switching display modes.
- [ ] Add regression checks for map utility behavior and route smoke compatibility.

## Milestone 4 - Validation, Documentation, and Release Readiness

- [ ] Run build and targeted unit tests after map refactor.
- [ ] Run full E2E suite and resolve regressions.
- [ ] Document map controls and density modes in docs for operator workflow.
- [ ] Confirm route compatibility with global filter strip behavior.
- [ ] Finalize checklist completion state.
