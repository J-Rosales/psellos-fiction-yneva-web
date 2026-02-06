# UX and Navigation Specification

## 1. Objective

Define a portfolio-grade prosopographical UX that prioritizes exploratory discovery, visual impact, and consistent cross-view interaction patterns.

## 2. Intent and Audience

- Primary audience: scholars/research users.
- Primary UX objective: visual storytelling and showcase quality.
- Navigation philosophy: exploratory first.
- Launch depth: broad capability over minimal-screen scope.

## 3. Information Architecture

Top-level routes:
- `/` overview dashboard
- `/entities`
- `/entity/:id`
- `/graph`
- `/map`
- `/layers`
- `/search`
- `/diagnostics` (secondary/admin surface)

Entity detail is a major route, but not the single center of the product.

## 4. Global Search and Filters

- Search is persistent in the header.
- Search mode toggle is global:
  - fuzzy (default)
  - exact
- Filter application uses explicit `Apply` and `Reset` with silent apply behavior.
- `Reset` is full reset, including `layer` reset to default (`canon`).
- Pinning is global across routes.
- Incompatible pinned filters remain visible but disabled/inert until user resolves them.
- Layer selector is always visible globally; selectable options can vary by route context.

## 5. URL State and Routing Behavior

- Nearly all filter state and UI chrome state is encoded in URL.
- Back/forward behavior strictly restores all encoded state.
- Cross-view transfer across major route types prompts the user before carrying filters.
- Share behavior is intentionally narrower than full URL state:
  - share links capture stable analysis context (core filters + selected entity),
  - ephemeral UI microstate is not required in shared links.

## 6. Graph UX Requirements

- Entry mode starts from selected entity neighborhood.
- Deep traversal is available by default.
- Node click opens a side-panel card.
- Side-panel card defaults to compact summary, with expand-on-demand.
- Media is shown only when high-confidence assets are available.
- Card actions are route/context-specific from the start.
- Panel selection behavior is replace/auto-close on selection change.
- Edge labels are shown by default.

Cluster controls:
- `View *` controls are inference-based modes derived from assertions/relations.
- Clustering uses weighted/scored semantics.
- Multi-membership across clusters is allowed.
- Cluster precedence controls are user-selectable in Advanced options.
- Launch control surface remains minimal; advanced controls live under Advanced options.

## 7. Map UX Requirements

- Map is a primary discovery surface.
- Discovery mode is place-first.
- Results are grouped by place, then entities.
- Map interaction conventions are Earth-like with support for scale-modifier worlds.
- Initial map display uses raw markers.
- Marker click opens the same side-panel card pattern used by graph.

## 8. Semantics Consistency Policy

- Core filter keys are shared across routes (`layer`, search, relation filters, date filters).
- Layer filtering remains hard-filter semantics.
- View-specific semantics are allowed where they improve local UX (for example ranking, clustering, and presentation behavior).
- Unknown/ambiguous states are explicitly shown as buckets, not hidden.

## 9. Accessibility and Mobile Policy

- First stable release is desktop-first.
- Mobile release is scheduled for the post-stable phase after first desktop release.
- Planned mobile interaction style for that phase:
  - touch-first simplified controls,
  - full-screen detail takeover for panel content.
- Initial interaction priority is visual UX first; full accessibility hardening follows in post-stable phase.

## 10. Validation Checklist

- Header search and global mode toggle work across all primary routes.
- Full reset includes layer reset to `canon`.
- Global pinning behavior survives cross-route navigation.
- Cross-view filter carry prompts appear on major-route transitions.
- URL round-trip reproduces encoded UI/filter state.
- Graph and map use consistent side-panel card interaction.
- Place-first map grouping and unknown/ambiguous buckets are visible in UI.
