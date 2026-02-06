---
name: constructed-world-map-compat
description: Validate constructed-world map assumptions for Earth-like interaction with scale modifiers and optional PostGIS compatibility. Use when defining projection/radius settings or preparing map backend integration.
---

# Constructed World Map Compat

Validate spatial model settings before map implementation work.

## Workflow

1. Define world/projection config in JSON.
2. Run `scripts/validate_scale_model.py`.
3. Confirm scale modifier and coordinate assumptions.
4. Use compatibility output to decide whether PostGIS is safe to enable.

## Command

```bash
python skills/constructed-world-map-compat/scripts/validate_scale_model.py --config world.json
```

## References

- Model policy: `references/model.md`
- Script: `scripts/validate_scale_model.py`

Use this skill before committing to geospatial storage strategy.
