# ADR-0002: Read-Only Index Database for Querying

- Status: Accepted
- Date: 2026-02-06

## Context

Compiled artifacts are authoritative for this web layer, but advanced lookup/routing and cross-view filtering require indexed query performance.

## Decision

Introduce a read-only index database derived only from compiled builder artifacts.

Decision details:
- Database is for indexing/query acceleration, not canon authoring.
- No writes from end users.
- Ingestion process is deterministic and reproducible from artifact inputs.
- Layer filtering is first-class across graph/map/entity query surfaces.
- Database engine is PostgreSQL.
- Search indexing is DB-native initially.
- Indexing cadence is batch rebuild on artifact publish.
- Database remains disposable; compiled artifacts remain source of truth.
- API style is resource-oriented HTTP endpoints.
- API implementation baseline is Fastify + TypeScript.
- Contract/request validation baseline is Zod.
- PostgreSQL access baseline is via the `pg` client.
- API starts unversioned and versions at first breaking change.
- Error model starts minimal and consistent (`status`, `message`, `request_id`, optional `layer`).
- Observability starts with basic logs and latency metrics; audit metadata is optional initially.

## Consequences

Positive:
- Faster query paths and scalable filtering.
- Enables richer graph/map navigation.
- Clear operational boundary between canonical artifact production and web query serving.

Tradeoff:
- Added operational complexity (ingestion + schema management).
- Requires disciplined schema/contract regression checks before opening API to external clients.

## Notes

External/non-frontend API support is allowed only after stability gates are met (documented semantics, stable behavior, regression coverage).
