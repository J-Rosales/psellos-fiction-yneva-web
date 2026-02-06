---
name: mui-filter-url-state-sync
description: Synchronize MUI filter controls with URL state and route transitions, including apply/reset/pin and layer preservation policies. Use when implementing shared filtering behavior across views.
---

# MUI Filter URL State Sync

Keep filter behavior policy-consistent in MUI UIs.

## Workflow

1. Define filter schema and URL encoding rules.
2. Bind MUI form controls to local draft state.
3. Apply/reset writes to URL according to policy.
4. Verify cross-view handoff prompt and layer behavior.

## Commands

```bash
python skills/mui-filter-url-state-sync/scripts/check_filter_sync.py --root .
```

## References

- Policy summary: `references/filter-url-policy.md`
- Script: `scripts/check_filter_sync.py`