---
name: mui-theme-system-governor
description: Establish and enforce a single MUI theme system with palette, typography, spacing, and component overrides across the app. Use when creating or refactoring visual styling to avoid drift.
---

# MUI Theme System Governor

Define and enforce a single source of truth for theme styling.

## Workflow

1. Run theme audit script to detect direct color/style drift.
2. Generate or update central MUI theme module.
3. Move repeated styles into `components` theme overrides.
4. Re-run audit and fix violations.

## Commands

```bash
python skills/mui-theme-system-governor/scripts/audit_theme_usage.py --root .
python skills/mui-theme-system-governor/scripts/audit_theme_usage.py --root . --report tmp/theme-audit.json
```

## References

- Theme policy: `references/theme-policy.md`
- Audit script: `scripts/audit_theme_usage.py`

Use this skill when introducing new screens or changing visual design.