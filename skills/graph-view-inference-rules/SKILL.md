---
name: graph-view-inference-rules
description: Build and validate weighted inference rules for graph View* clustering modes using only assertions and relations. Use when defining or tuning graph navigation semantics like View Dynasty or View Workplace.
---

# Graph View Inference Rules

Infer cluster memberships and scores deterministically from artifact assertions.

## Workflow

1. Run inference on `assertions.json` or `assertions_by_id.json`.
2. Review score outputs for each mode.
3. Tune rules in `references/ruleset.md`.
4. Re-run and compare before adopting new weights.

## Command

```bash
python skills/graph-view-inference-rules/scripts/infer_clusters.py --assertions public/data/assertions.json --mode all
```

## Guardrails

- Use only assertion/relationship evidence; no external canon inference.
- Preserve multi-membership support.
- Keep precedence user-selectable in UI advanced options.

## References

- Scoring and token rules: `references/ruleset.md`
- Script: `scripts/infer_clusters.py`

Use this skill whenever View* mode semantics are touched.
