---
name: desktop-release-gate
description: Run desktop-first release readiness checks for documentation sync, contract policy, route/filter behavior claims, and optional build verification. Use before tagging or presenting a stable desktop milestone.
---

# Desktop Release Gate

Run a deterministic gate report for stable desktop readiness.

## Workflow

1. Run gate script without build for fast policy checks.
2. Run again with `--run-build` before release.
3. Treat failures as release blockers.
4. Include gate report in release notes.

## Commands

```bash
python skills/desktop-release-gate/scripts/run_release_gate.py --root .
python skills/desktop-release-gate/scripts/run_release_gate.py --root . --run-build
```

## References

- Release checklist: `references/checklist.md`
- Script: `scripts/run_release_gate.py`

Use this skill for release go/no-go decisions.
