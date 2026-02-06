---
name: spec-adr-sync-checker
description: Detect and resolve drift between OVERHAUL_PLAN, DATA_QUERY_SPEC, UX_NAV_SPEC, and ADR decisions. Use when goals change, before release, or before creating new implementation tickets.
---

# Spec ADR Sync Checker

Run a document consistency scan, then patch docs and ADRs in the same change.

## Quick Workflow

1. Run `scripts/check_sync.py` from repo root.
2. Review failing checks and warnings.
3. Update spec and ADR files together.
4. Re-run until no failures remain.

## Command

```bash
python skills/spec-adr-sync-checker/scripts/check_sync.py --root .
```

## Guardrails

- Prefer precise phrase updates over broad rewrites.
- Keep decisions synchronized across all three spec docs and ADRs.
- Do not introduce canon/business rules outside established scope.

## References

- Sync matrix: `references/sync-map.md`
- Script: `scripts/check_sync.py`

Use this skill any time product policy shifts.
