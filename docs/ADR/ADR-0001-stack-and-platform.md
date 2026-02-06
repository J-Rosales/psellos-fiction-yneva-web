# ADR-0001: Stack and Platform Direction

- Status: Accepted
- Date: 2026-02-06

## Context

Current repository is Vite + TypeScript with static artifact fetching and custom DOM rendering.
New requirements include advanced navigation, graph and map interactions, and stronger cross-view state handling.

## Decision

Adopt a route-driven frontend platform while preserving read-only artifact consumption boundaries and canonical separation.

Decision details:
- Keep TypeScript and web-first build tooling.
- Use route-driven UI with URL-encoded state for most controls.
- Keep share links focused on stable analysis context (core filters + selected entity), not full UI microstate.
- Use explicit `Apply` and `Reset` filter behavior; `Reset` includes `layer` reset to `canon`.
- Keep global filter pinning across routes, with incompatible pinned filters shown as inert until resolved.
- Prompt users on major cross-view transfers before carrying filters.
- Keep frontend contract internal-first, with lightweight endpoint documentation first and formal OpenAPI later.

## Consequences

Positive:
- Better maintainability for complex UI flows.
- Stronger consistency across graph/map/entity interactions.
- Predictable route/state behavior for portfolio-quality demos and reviews.

Tradeoff:
- Migration effort from current view composition style.
- Additional URL-state complexity and state-restoration testing burden.
