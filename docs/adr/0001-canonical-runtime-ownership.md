# ADR 0001: Canonical Runtime Ownership

## Status

Accepted for Phase 0 baseline.

## Context

The repo currently behaves like several applications sharing one workspace:

- the canonical browser build lives in `client/`
- the main Express application lives in `server/`
- `src/api/v1` is mounted into the Express app and duplicates parts of the main API
- root `src/` also contains frontend-style pages and services that overlap with `client/`
- `functions/` and `netlify/functions/` provide additional runtime paths, with Netlify functions currently using mock Firebase behavior

This creates three problems:

1. There is no single source of truth for route ownership.
2. Feature work can accidentally extend duplicate paths instead of the main product path.
3. The repo cannot become uniformly complete while parallel runtimes remain first-class.

## Decision

The repo will be normalized around one canonical product runtime:

- Canonical frontend: `client/`
- Canonical application backend: `server/`
- Canonical shared contract boundary: `shared/`
- Transitional API code in `src/api/v1` may remain only while being migrated under `server/` ownership
- Root `src/` frontend-style pages and services are not canonical and must be moved into `client/` or retired
- Firebase support code may remain only for platform integrations such as auth, storage, functions, or Data Connect where explicitly retained
- Netlify functions are not a canonical runtime for core product logic and should be retired from primary ownership
- Primary deployment path is the Express application started by [server/server/index.ts](/workspace/server/server/index.ts)

## Consequences

### Positive

- New feature work has a default home
- Duplicate API and page ownership becomes measurable and removable
- Deployment, testing, and documentation can be reduced to one primary path

### Negative

- Some existing `src/`, `functions/`, and `netlify/functions/` code will need migration or removal
- Short-term migration work will touch routing, imports, tests, and docs before visible product gains land

## Rules For Subsequent Phases

- No new user-facing features should be added to root `src/` frontend pages/services
- No new duplicate `/api/*` and `/api/v1/*` implementations should be introduced
- New backend work belongs in `server/`
- New frontend work belongs in `client/`
- Serverless code must support the canonical app, not compete with it

## Migration Notes

- Phase 1 should first map each `src/api/v1` route to a `server/` destination or a retirement decision
- Phase 2 should remove mock/demo behavior from the chosen canonical path before widening feature scope
- Phase 3 and beyond should implement missing product flows only on the canonical runtime
