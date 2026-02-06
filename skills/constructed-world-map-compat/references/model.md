# Constructed World Spatial Model

## Required Config Fields

```json
{
  "world": {
    "name": "Example",
    "reference_radius_km": 6371.0,
    "radius_km": 4500.0
  },
  "projection": "geodetic",
  "points": [
    { "id": "p1", "lat": 10.0, "lon": 20.0 }
  ]
}
```

## Rules

- Preserve Earth-like interaction conventions.
- Apply scale modifier = `radius_km / reference_radius_km`.
- Keep geodetic bounds unless a custom projection intentionally redefines bounds.
- Enable PostGIS only when projection and coordinate behavior are confirmed compatible.
