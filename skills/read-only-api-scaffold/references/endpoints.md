# Read-Only Endpoint Baseline

## Endpoint Style

- Resource-oriented HTTP.
- Frontend-internal first.
- Unversioned until first breaking change.

## Required Surfaces

- `GET /api/entities`
- `GET /api/entities/:id`
- `GET /api/assertions`
- `GET /api/graph/neighborhood`
- `GET /api/map/features`
- `GET /api/layers`
- `GET /api/layers/:id/changelog?base=canon`

## Core Query Policy

- `layer` hard-filter semantics, defaulting to `canon`.
- Unknown layer returns empty result + warning metadata.
- Minimal error shape: `status`, `message`, `request_id`, optional `layer`.
