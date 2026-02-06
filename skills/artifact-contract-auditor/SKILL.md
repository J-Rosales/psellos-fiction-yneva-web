---
name: artifact-contract-auditor
description: Validate compiled psellos-builder artifacts for required contract fields, layer-safe behavior, and forward-compatibility warnings. Use when ingesting new artifact drops, preparing releases, or debugging invalid data under public/data.
---

# Artifact Contract Auditor

Run a deterministic artifact audit and produce a machine-readable report.

## Quick Workflow

1. Run `scripts/audit_artifacts.py` against a data directory.
2. Fail on schema/contract errors, warn on unknown or optional-field issues.
3. Patch upstream artifact generation or copy process; do not patch canon logic here.
4. Re-run and include the report in review notes.

## Commands

```bash
python skills/artifact-contract-auditor/scripts/audit_artifacts.py --data-dir public/data --profile m2c
python skills/artifact-contract-auditor/scripts/audit_artifacts.py --data-dir public/data --profile m2b --report out/artifact-audit.json
```

## Guardrails

- Validate only compiled artifacts.
- Treat unknown fields as warnings, not hard failures, unless they break required-field parsing.
- Keep this skill read-only with respect to canon and domain inference.

## References

- Contract expectations: `references/contracts.md`
- Script: `scripts/audit_artifacts.py`

Use this skill before any major UI/data work that depends on artifact contract stability.
