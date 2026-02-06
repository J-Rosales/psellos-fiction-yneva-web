---
name: url-state-filter-policy-tester
description: Verify URL state, layer/filter reset, pin behavior, and cross-view handoff policy across UX/docs and implementation files. Use before releases and after routing or filter logic changes.
---

# URL State Filter Policy Tester

Run a repeatable policy check for navigation/filter behavior.

## Workflow

1. Run `scripts/check_url_policy.py`.
2. Treat failures as contract violations.
3. Treat implementation-only gaps as warnings when source code is still evolving.
4. Keep docs and implementation consistent.

## Command

```bash
python skills/url-state-filter-policy-tester/scripts/check_url_policy.py --root .
```

## References

- Policy checklist: `references/policy-checklist.md`
- Script: `scripts/check_url_policy.py`

Use this skill for every route/filter change.
