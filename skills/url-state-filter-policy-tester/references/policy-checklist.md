# URL and Filter Policy Checklist

## Required Policy Statements

- Nearly all filter and UI chrome state is URL-encoded.
- Full reset includes `layer` reset to `canon`.
- Global pinning persists across routes.
- Incompatible pinned filters remain visible and inert.
- Major cross-view transfers prompt before carrying filters.
- Graph and map share side-panel interaction model.

## Validation Surfaces

- `docs/UX_NAV_SPEC.md`
- `docs/OVERHAUL_PLAN.md`
- `src/main.ts` and route/view code

## Failure vs Warning

- Missing policy in docs: failure.
- Missing implementation hints in source during migration: warning.
