---
name: mui-accessibility-hardening
description: Audit and harden accessibility for MUI-based screens including keyboard flow, focus handling, labels, and panel interactions in graph/map hybrid pages. Use before stable release and after major UI changes.
---

# MUI Accessibility Hardening

Run targeted accessibility checks and fix loops for MUI-heavy routes.

## Workflow

1. Audit common violations in JSX and interactions.
2. Fix focus order, landmarks, labels, and keyboard traps.
3. Re-run checks and document residual risks.

## Commands

```bash
python skills/mui-accessibility-hardening/scripts/check_a11y_markers.py --root .
```

## References

- A11y baseline: `references/a11y-baseline.md`
- Script: `scripts/check_a11y_markers.py`