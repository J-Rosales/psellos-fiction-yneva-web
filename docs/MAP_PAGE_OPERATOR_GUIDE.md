# Map Page Operator Guide

## Purpose

The Map page is a place-first exploration surface for compiled prosopographical assertions with geospatial coordinates.

## Controls

- `Scale preset`: switches world radius assumptions (`Earth`, `Yneva-like`, `Custom`).
- `Radius km`: custom radius value when `Scale preset` is `Custom`.
- `Density mode`:
  - `Clusters`: grouped circles + count labels for dense browsing.
  - `Points`: direct point rendering for inspection.
  - `Heatmap`: spatial density exploration.
- `Fit results`: fits camera bounds to all currently renderable places.
- `Zoom +` / `Zoom -`: manual zoom adjustment.
- `Reset view`: resets bearing/pitch while preserving context.

## Navigation Modes

- Keyboard-first workflow:
  - Use the place list (`Place-first results`) to select places.
  - Selection updates the details panel and flies the map camera to that place.
- Visual workflow:
  - Click non-cluster points to select a place.
  - Click cluster circles to zoom into that cluster area.

## Stability and Behavior Notes

- Place details remain stable while switching `Density mode`.
- If no place is selected, the details panel shows an explicit empty state.
- Unknown/ambiguous geo buckets are always displayed for operator awareness.
- Global filter strip remains authoritative for layer/query context.

## Validation Coverage

- `npm run build`
- `npm run test:unit -- src/views/mapUtils.test.ts`
- `npx playwright test --reporter=line`
