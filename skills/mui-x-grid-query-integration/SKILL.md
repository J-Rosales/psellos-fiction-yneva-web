---
name: mui-x-grid-query-integration
description: Implement and validate MUI X DataGrid wiring for server-side filtering, sorting, pagination, and layer-aware query parameters. Use when building entity/assertion index pages.
---

# MUI X Grid Query Integration

Build repeatable DataGrid-to-query patterns.

## Workflow

1. Define query parameter contract for grid state.
2. Map DataGrid model changes to URL/API query.
3. Validate layer hard-filter behavior remains preserved.
4. Add integration checks for page/sort/filter round-trip.

## Commands

```bash
python skills/mui-x-grid-query-integration/scripts/check_grid_contract.py --root .
```

## References

- Grid query mapping: `references/grid-contract.md`
- Script: `scripts/check_grid_contract.py`