---
name: read-only-api-scaffold
description: Scaffold read-only resource-oriented API modules aligned with layer hard-filter semantics, minimal error shape, and frontend-internal contract policy. Use when bootstrapping or expanding query endpoints.
---

# Read Only API Scaffold

Generate endpoint skeletons quickly and consistently.

## Workflow

1. Run scaffold script with target output dir.
2. Generate baseline handlers for entities/assertions/graph/map/layers.
3. Fill data access internals while preserving request/response contract shape.
4. Keep endpoint policy aligned with spec docs and ADRs.

## Command

```bash
python skills/read-only-api-scaffold/scripts/scaffold_api.py --out-dir generated-api
```

## References

- Endpoint contract baseline: `references/endpoints.md`
- Templates: `assets/*.template.ts`
- Script: `scripts/scaffold_api.py`

Use this skill when backend/query scaffolding must stay consistent with documentation policy.