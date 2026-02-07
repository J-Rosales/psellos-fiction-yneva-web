# Builder Dist-Run Inbox

This folder is the canonical handoff target for compiled builder output.

Expected structure:

- `machine/` (required)
- `entities/` (required)
- `indexes/` (optional)
- `reports/` (optional)
- `narrative_layer_assertions.yml` (optional)

Workflow:

1. Export/copy a full dist-run from `psellos-builder` into `builder-dist-run/`.
2. Run `npm run import:dry` to validate and preview report output.
3. Run `npm run import:apply` to write normalized artifacts to `public/data/`.

This repository consumes compiled artifacts only; do not place raw upstream source/spec files here.
