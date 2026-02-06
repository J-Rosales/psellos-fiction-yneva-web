---
name: mui-view-scaffold-factory
description: Scaffold consistent MUI view shells for entity, graph, map, and diagnostics pages with shared layout regions and side-panel patterns. Use when creating new routes quickly and consistently.
---

# MUI View Scaffold Factory

Generate reusable MUI route shell templates.

## Workflow

1. Run scaffold generator for a view type.
2. Fill data hooks and route wiring.
3. Keep header/filter/panel zones structurally consistent.

## Commands

```bash
python skills/mui-view-scaffold-factory/scripts/scaffold_view.py --name map --out src/views-react
python skills/mui-view-scaffold-factory/scripts/scaffold_view.py --name graph --out src/views-react
```

## References

- Layout conventions: `references/layout-conventions.md`
- Templates: `assets/view.template.tsx`
- Script: `scripts/scaffold_view.py`