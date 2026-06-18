# WorkWise SA

WorkWise SA is a South African employment platform built around job discovery, employer workflows, candidate profiles, CV tooling, content/learning surfaces, and a growing job-ingestion pipeline.

This repository behaves like a monorepo, but it is not a clean single-app codebase. It contains a primary React frontend, an Express backend, shared Drizzle schema/types, legacy Firebase and Netlify runtimes, and a Python scraping subsystem.

## Current Repo Reality

The most important thing to understand before editing this repo is that it contains parallel code paths:

- `client/` is the main browser application used by the root Vite build.
- `server/` is the main Express backend and Drizzle storage layer.
- `shared/` contains the SQL schema, Zod insert schemas, and shared types.
- `src/` now holds transitional support code, Swagger wiring, and a few shared modules. It is no longer the canonical frontend or `/api/v1` backend owner.
- `functions/` contains legacy Firebase Functions code.
- `netlify/functions/` contains legacy Netlify serverless code.
- `dataconnect/` and `dataconnect-generated/` contain Firebase Data Connect assets.
- `scrapy_jobs/` contains the Python-based scraping and ingestion pipeline.

This means “the app” is not one folder. The canonical browser/runtime paths are `client/`, `server/`, and `shared/`. Treat root `src/` as transitional support code unless a file clearly proves otherwise.

For a deeper codebase reference, see [docs/project/index.md](/workspace/docs/project/index.md).

## Product Areas

The repo currently covers these major product surfaces:

- public job browsing and filtering
- employer dashboards and job posting flows
- user authentication and profile setup
- CV/profile and file upload workflows
- company browsing
- WiseUp content/learning pages
- AI-assisted content and job-related tooling
- multi-source scraping and normalized job ingestion

Some areas are production-oriented, some are partial, and some still rely on mock/demo behavior. Treat the code as mixed maturity rather than uniformly complete.

## Architecture

### Frontend

The main frontend is the Vite app rooted in `client/`.

- entry: [client/src/main.tsx](/workspace/client/src/main.tsx)
- app shell: [client/src/core/app.tsx](/workspace/client/src/core/app.tsx)
- alias: `@` -> `client/src`
- shared alias: `@shared` -> `shared`
- dev server: Vite on `localhost:5173`
- API proxy target: Express on `localhost:3001`

Primary frontend technologies:

- React 18
- Vite
- Tailwind CSS
- Radix UI / shadcn-style primitives
- React Query
- Wouter

### Backend

The main server entry is [server/server/index.ts](/workspace/server/server/index.ts).

Backend responsibilities include:

- route registration
- auth middleware
- Swagger exposure
- database initialization
- storage layer setup
- secret loading
- caching
- monitoring
- scraping session/orchestration routes
- AI and recommendation services

Important routing facts:

- `server/server/index.ts` mounts [server/routes/v1.ts](/workspace/server/routes/v1.ts) under `/api/v1`
- `server/routes.ts` registers non-versioned `/api/*` routes
- `src/api/index.ts` is now a compatibility re-export, not the live route owner

### Database

The shared relational model is defined in [shared/schema.ts](/workspace/shared/schema.ts).

Primary entities include:

- users
- categories
- companies
- jobs
- job ingest records
- files
- job applications
- interaction/session/notification tables

Database behavior is environment-dependent:

- PostgreSQL is the canonical production database
- SQLite is dev/test only and should not drive production contract decisions
- Drizzle ORM owns the TypeScript data layer

### Scraping And Ingestion

The repo now includes a two-stage job ingestion pipeline:

1. Python scrapers extract, normalize, and anonymize job data.
2. The Node backend ingests validated batches and persists them through Drizzle.

Key files:

- orchestrator: [scrapy_jobs/run_scrapers.py](/workspace/scrapy_jobs/run_scrapers.py)
- Scrapy pipeline: [scrapy_jobs/scrapy_jobs/pipelines.py](/workspace/scrapy_jobs/scrapy_jobs/pipelines.py)
- compliance middleware: [scrapy_jobs/scrapy_jobs/middleware/compliance_middleware.py](/workspace/scrapy_jobs/scrapy_jobs/middleware/compliance_middleware.py)
- ingest contract: [shared/job-ingest-schema.ts](/workspace/shared/job-ingest-schema.ts)
- ingest service: [server/services/jobIngestionService.ts](/workspace/server/services/jobIngestionService.ts)
- ingest route: [server/routes/v1.ts](/workspace/server/routes/v1.ts)

Supported/implemented scraping work is still evolving. The repo currently has real work around Gumtree, Job Mail, and Bizcommunity, but coverage is not uniform and source viability depends on robots, site behavior, and field quality.

Source rollout is now controlled by the legal/source registry in `scrapy_jobs/config/source-registry.json`. A source can be reviewed without being approved for ingest or higher concurrency.

## Repo Structure

```text
/workspace
├── client/                    # Primary React/Vite frontend
├── server/                    # Main Express backend, storage, middleware, services
├── shared/                    # Drizzle schema and shared TS/Zod contracts
├── src/                       # Transitional support code and Swagger helpers
├── functions/                 # Firebase Functions runtime
├── netlify/functions/         # Netlify serverless functions
├── dataconnect/               # Firebase Data Connect config/schema
├── dataconnect-generated/     # Generated Data Connect client package
├── scrapy_jobs/               # Python scraping + normalization + ingest artifacts
├── scripts/                   # Operational and build scripts
├── migrations/                # SQL migrations
├── public/                    # Shared static assets
├── archive/                   # Archived historical artifacts
└── docs/                      # Project documentation
```

## Prerequisites

- Node.js `22.x` or `24.x`
- `pnpm` `10.x`
- Python `3.12+` for scraping work
- Git
- access to project environment variables if running live services

Optional but often needed:

- Firebase CLI
- Netlify CLI
- PostgreSQL, unless using SQLite fallback

## Installation

### Root workspace

```bash
pnpm install
```

This repo is normalized around `pnpm` at the root. The root `package-lock.json` has been removed intentionally.

### Python scraping dependencies

```bash
python3 -m pip install -r scrapy_jobs/requirements.txt
```

If your environment does not ship with `pip`, install it first before working on `scrapy_jobs/`.

## Environment Setup

Create root and client environment files as needed:

```bash
cp .env.example .env
cp .env.example client/.env
```

Important notes:

- local development can still run with selective fallbacks
- primary production expects PostgreSQL, real Firebase credentials, and real AI/provider credentials
- scraping ingest can be protected with `SCRAPING_INGEST_TOKEN`
- database mode depends heavily on `DATABASE_URL`
- `VITE_API_URL` should point at the Express API root and defaults to `/api`
- `VITE_USE_MOCK_PUBLIC_DATA` should stay `false` outside explicit local mock testing

Useful commands:

```bash
pnpm run env:check
pnpm run env:sanitize
pnpm run env:verify:supported
pnpm run check:firebase-config
```

## Development

### Main app

```bash
pnpm run dev
```

Expected local ports:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

### Backend only

```bash
pnpm run dev:server
```

### Frontend only

```bash
pnpm run dev:client
```

### With emulator checks

```bash
pnpm run dev:with-checks
```

This validates Firebase emulator availability before starting the main dev flow.

## Database And Migrations

Generate migrations:

```bash
pnpm run db:generate
```

Run migrations:

```bash
pnpm run db:migrate
```

Test migrations:

```bash
pnpm run db:migrate:test
```

Other useful commands:

```bash
pnpm run db:push
pnpm run db:status
pnpm run db:studio
```

## Scraping Workflows

Run a single source locally:

```bash
python3 scrapy_jobs/run_scrapers.py --source=gumtree
```

Run all configured sources:

```bash
python3 scrapy_jobs/run_scrapers.py --source=all
```

Run and ingest into the Node backend:

```bash
python3 scrapy_jobs/run_scrapers.py --source=gumtree --ingest=true
```

The scraper now:

- writes raw artifacts
- writes normalized artifacts
- applies normalization/compliance filtering
- can POST normalized batches to `/api/v1/jobs/ingest`
- writes retry payloads if ingestion POSTs fail

## Quality And Verification

### Root sanity check

```bash
pnpm check
```

This is a root repository sanity check. It validates the package manager/lockfile/config state. It is not the same as a full repo-wide TypeScript compile.

### Lint

```bash
pnpm run lint
pnpm run lint:fix
```

### TypeScript

```bash
pnpm run type-check
```

Important current reality: `type-check` still surfaces broad legacy TypeScript debt across mixed codepaths. Do not assume it is green.

### Tests

```bash
pnpm run test
pnpm run test:unit
pnpm run test:integration
pnpm run test:api
pnpm run test:coverage
```

Backend-only tests:

```bash
pnpm run test:server
```

Current reality: `test:server`, `test:unit`, `test:integration`, and `test:api` all point at the maintained backend unit suite and route-level API checks that run cleanly in the canonical environment. Older demo-style and bind-to-port backend tests have been retired instead of kept as dead fallback paths.

E2E:

```bash
pnpm run test:e2e
```

## Build And Deploy

Build:

```bash
pnpm run build
```

Primary production runtime:

```bash
pnpm run env:check-prod
pnpm run env:verify:primary
pnpm run build
pnpm run start
pnpm run deploy:prod
```

Primary runtime facts:

- `pnpm run build` produces `dist/public` for frontend assets and `dist/index.js` for the Express server
- `pnpm run start` runs the bundled Express server from `dist/index.js`
- `pnpm run deploy:prod` validates the primary Express deployment contract and environment requirements
- `pnpm run env:verify:primary` audits database, uploads, Firebase, AI, cache, SMS, and ingest wiring for the supported production model
- PostgreSQL is the canonical production database

Legacy Netlify/Firebase commands remain in the repo for compatibility and migration support, but they are not the canonical production path.

Legacy Netlify commands:

```bash
pnpm run netlify:prepare
pnpm run netlify:build
pnpm run netlify:validate
pnpm run deploy:legacy:netlify
```

Legacy Firebase commands:

```bash
pnpm run firebase:build
pnpm run deploy:legacy:firebase:hosting
pnpm run deploy:legacy:firebase:functions
pnpm run deploy:legacy:firebase:all
```

Data Connect:

```bash
pnpm run dataconnect:sdk:generate
pnpm run dataconnect:sdk:patch-peers
pnpm run dataconnect:sdk:regenerate
```

## Documentation Notes

The docs in `docs/archive/initial-docs/` are useful for product intent and historical planning, but several of them are stale relative to the live codebase.

Use these references carefully:

- [docs/project/index.md](/workspace/docs/project/index.md) for the current high-level technical index
- `docs/archive/initial-docs/` for historical specs and research
- code itself for final authority when architecture docs and implementation disagree

## Known Caveats

- the repo contains overlapping frontend and backend implementations
- some features remain mock-backed or partially integrated
- root quality tooling is healthier than the full application graph
- full type safety is not yet restored across the whole workspace
- scraping source quality varies by platform and robots/compliance limits
- legacy Firebase/Netlify deployment assets still exist, but they are no longer the primary runtime contract
- file storage is still local-disk based and requires a writable upload volume plus a correct `FILE_SERVE_URL`

## Recommended Editing Strategy

Before making non-trivial changes:

1. identify whether the feature lives in `client/`, `server/`, `src/`, or multiple places
2. check [shared/schema.ts](/workspace/shared/schema.ts) for data contracts
3. verify whether a route is mounted from `server/routes.ts` or `src/api/v1`
4. confirm whether the flow is using real persistence, fallback behavior, or mock services

That up-front check prevents most accidental regressions in this codebase.

## License

This project is licensed under the MIT License. See [LICENSE](/workspace/LICENSE) if present in your environment.
