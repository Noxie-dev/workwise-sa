# WorkWise SA Codebase Index

## Purpose

This repository contains the code for WorkWise SA, a job platform oriented around:

- public job discovery and company browsing
- user authentication and profiles
- CV/profile workflows
- employer-facing job posting and candidate flows
- content-style "WiseUp" learning/media pages
- AI-assisted features for CV generation, translation, summaries, and job-related workflows

The repo is not a strict monorepo, but it behaves like one. It contains multiple partially overlapping application surfaces, deployment targets, and runtime models inside a single workspace.

## High-Level System Shape

At a high level, the repo contains five main code strata:

1. `client/`
   Main React/Vite frontend used by the top-level Vite config.

2. `server/`
   Express backend, Drizzle-backed data access, AI services, auth middleware, file handling, and websocket support.

3. `shared/`
   Drizzle schema and shared types consumed by both frontend and backend.

4. `src/`
   A second root-level application/API layer. This contains:
   - an Express API slice mounted under `/api/v1`
   - a second frontend app shell and related services/components
   - middleware and service code that overlaps with `client/` and `server/`

5. platform-specific runtimes
   - `functions/` for Firebase Functions
   - `netlify/functions/` for Netlify serverless functions
   - `dataconnect/` and `dataconnect-generated/` for Firebase Data Connect
   - `scrapy_jobs/` for Python scraping

The important architectural reality is that this repo contains duplicated or parallel implementations of some concepts instead of a single canonical path.

## Runtime Architecture

### Frontend runtime

The primary frontend build is defined by the root [vite.config.ts](/workspace/vite.config.ts):

- Vite root is `./client`
- source alias `@` resolves to `./client/src`
- `@shared` resolves to `./shared`
- dev proxy forwards `/api` and `/ws` to the Express server on `localhost:3001`
- production build outputs to `dist/public`

The browser app boots from [client/src/main.tsx](/workspace/client/src/main.tsx) and renders [client/src/core/app.tsx](/workspace/client/src/core/app.tsx).

Core frontend providers:

- `HelmetProvider` for metadata/SEO
- React Query `QueryClientProvider`
- `AuthProvider`
- `Toaster`
- lazy-loaded page routing via `wouter`

### Backend runtime

The main backend entry point is [server/server/index.ts](/workspace/server/server/index.ts).

Startup sequence:

1. load env via `dotenv`
2. preload secrets through `secretManager`
3. initialize the database
4. initialize cache and auth-monitoring services
5. configure Express middleware
6. mount Swagger docs
7. mount root `src/api` router at `/api`
8. register legacy/original routes via `registerRoutes(app)`
9. attach error handlers
10. listen on `PORT`

Important implication:

- the backend is composed from both `server/` and root `src/`
- `/api/v1/*` comes from `src/api`
- many `/api/*` endpoints also come from `server/routes.ts`

This mixed composition should be treated as a core architectural fact when changing routes.

## Major Code Areas

### `client/`: main frontend application

Main responsibilities:

- public site pages
- authenticated user flows
- employer pages
- dashboards and UI components
- WiseUp UI
- service wrappers for API access
- frontend tests

Important directories:

- `client/src/components/`
  Shared UI and feature components. Includes:
  - generic UI primitives in `components/ui/`
  - employer, dashboard, salary, resources, and accessibility feature groups

- `client/src/contexts/`
  Auth, permissions, accessibility, user, and provider state.

- `client/src/hooks/`
  App-specific hooks for auth, menus, forms, lazy loading, favorites, etc.

- `client/src/lib/`
  Low-level client wiring:
  - API config
  - Firebase config
  - Firestore helpers
  - Gemini integration
  - query client setup

- `client/src/pages/`
  Routed pages. Key domains:
  - jobs
  - profile
  - resources
  - WiseUp
  - admin
  - employers

- `client/src/services/`
  Frontend service layer for jobs, companies, profiles, dashboards, marketing rules, uploads, WiseUp, websocket access, and AI-adjacent integrations.

Observations:

- `client/` appears to be the primary browser application.
- There is a mix of `.ts/.tsx` and legacy `.js/.jsx`.
- There are tests colocated across `__tests__`, `*.test.tsx`, and feature folders.
- There are a number of backup/refactored/manual-test artifacts, which suggests incremental migration rather than a finished cleanup.

### `server/`: main Express and application backend

Main responsibilities:

- REST endpoints
- storage/data access abstraction
- database initialization
- secret resolution
- auth and authorization
- AI workflows
- recommendation and scoring systems
- file upload/storage
- websocket server support
- Swagger generation

Important files:

- [server/server/index.ts](/workspace/server/server/index.ts)
  Main application startup.

- [server/routes.ts](/workspace/server/routes.ts)
  Large legacy route registration file. Contains many `/api/*` handlers directly on the Express app.

- [server/routes/index.ts](/workspace/server/routes/index.ts)
  A second route registration module that mounts AI/auth-monitoring/storage routes and returns an HTTP server. This overlaps in name and purpose with `server/routes.ts`.

- [server/storage.ts](/workspace/server/storage.ts)
  Data access abstraction. Implements `IStorage` against Drizzle. This is a key seam in the backend.

- [server/db.ts](/workspace/server/db.ts)
  Chooses SQLite or Postgres based on `DATABASE_URL`. SQLite is used when the connection string starts with `sqlite`; otherwise Postgres is used.

- `server/services/`
  Notable subsystems:
  - `secretManager.ts`
  - `cacheService.ts`
  - `authMonitoringService.ts`
  - `enhancedAuthService.ts`
  - `enhancedJobScoring.ts`
  - `mlJobMatching.ts`
  - `metricsService.ts`
  - `tokenRefreshService.ts`
  - `aiService.ts`
  - `aiServiceManager.ts`

- `server/middleware/`
  Error handling, auth, validation, performance monitoring.

- `server/tests/`
  Unit, integration, and feature tests for backend behavior.

Observations:

- `server/` mixes old and new route patterns.
- There are multiple auth middleware implementations across `server/` and root `src/`.
- Database behavior is environment-sensitive and tolerant of development fallbacks.
- Some endpoints intentionally return mock data in development when the database is unavailable.

### `shared/`: schema and cross-runtime types

This is the most important shared boundary for data contracts.

Primary file:

- [shared/schema.ts](/workspace/shared/schema.ts)

Main entities defined here:

- `users`
- `categories`
- `companies`
- `jobs`
- `files`
- `jobApplications`
- `userInteractions`
- `userNotifications`
- `userSessions`
- `userJobPreferences`

This file also exports:

- Drizzle table definitions
- Zod insert schemas
- inferred TS types
- relationship definitions

This schema is consumed directly by the backend storage layer and indirectly by parts of the frontend via `@shared`.

### `src/`: secondary app/API layer

This directory is structurally important.

It contains:

- `src/api/`
  Express router code. [src/api/index.ts](/workspace/src/api/index.ts) mounts `v1`.

- `src/api/v1/`
  Versioned routes for:
  - categories
  - companies
  - jobs
  - users
  - top-hiring
  - CV
  - WiseUp

- `src/middleware/auth.ts`
  Firebase-token auth middleware used by the v1 API surface.

- `src/core/`, `src/components/`, `src/pages/`, `src/services/`
  A second frontend-style code area that overlaps with `client/src`.

Observations:

- `src/` is not dead code; it is actively imported by the backend.
- `server/server/index.ts` mounts `src/api` under `/api`.
- `src/core/app.tsx` looks like another frontend app shell, but the root Vite config points to `client/`, not `src/`.
- This means `src/` is partly live backend code and partly overlapping frontend code.
- Treat `src/` as mixed-use territory until a consolidation plan exists.

## Authentication and Authorization

Authentication is Firebase-centric.

Main auth surfaces:

- frontend Firebase config in `client/src/lib/firebase.ts`
- backend verification in:
  - [src/middleware/auth.ts](/workspace/src/middleware/auth.ts)
  - [server/middleware/auth.ts](/workspace/server/middleware/auth.ts)
  - Netlify auth logic in `netlify/functions/auth.ts`

Current state:

- there are multiple auth middleware implementations
- role handling exists but is not fully centralized
- some routes still use placeholder or simplified auth assumptions
- the repo contains both Firebase Auth flows and user rows in SQL storage

This means the actual user model is hybrid:

- Firebase for identity/token verification
- SQL database for profile/role/business data
- Firestore/Firebase Admin in some serverless surfaces

## Data and Storage Model

### SQL database

Main DB path:

- schema in [shared/schema.ts](/workspace/shared/schema.ts)
- access via [server/storage.ts](/workspace/server/storage.ts)
- connection bootstrap in [server/db.ts](/workspace/server/db.ts)

Database modes:

- SQLite for local/testing paths
- PostgreSQL for production paths

### File storage

Files are represented in the SQL schema and also exposed through server and serverless endpoints.

Relevant areas:

- `server/storage.ts`
- `server/fileService.ts`
- `server/firestore-storage.ts`
- `server/routes/files.ts`
- `netlify/functions/files.js`
- `uploads/`

This suggests a hybrid file story:

- local filesystem uploads in development
- cloud-backed storage paths in hosted environments
- multiple code paths depending on deployment target

### Data Connect

The repo includes a separate Firebase Data Connect model:

- config in [dataconnect/dataconnect.yaml](/workspace/dataconnect/dataconnect.yaml)
- GraphQL schema in [dataconnect/schema/schema.gql](/workspace/dataconnect/schema/schema.gql)
- generated SDK in `dataconnect-generated/`

Important note:

- Data Connect models are not the same as the Drizzle SQL schema.
- This is a separate data surface with its own entities like `JobSeekerProfile`, `EmployerProfile`, and `JobPosting`.
- The generated SDK is vendored into the repo as a local package.

## API Surfaces

### Express legacy API

Defined mostly in [server/routes.ts](/workspace/server/routes.ts).

Examples:

- categories
- companies
- jobs
- job applications
- AI helper endpoints

Characteristics:

- direct route handlers on the Express app
- uses `storage` abstraction heavily
- contains dev mock fallbacks for some endpoints

### Versioned v1 API

Defined under `src/api/v1`.

Characteristics:

- mounted under `/api/v1`
- uses shared auth and rate limiting
- groups public and protected routes
- includes WiseUp and CV-specific flows

This appears to be the more structured API layer.

### Netlify functions

Defined in `netlify/functions/`.

Responsibilities include:

- auth helpers
- categories
- files
- upload URL generation
- job previews/details/applications

Netlify routing is configured in [netlify.toml](/workspace/netlify.toml).

Important note:

- these functions duplicate some backend concerns already handled by the main Express app
- they use Firebase Admin and serverless-http rather than the main Express server process

### Firebase functions

Defined in `functions/`.

Current state:

- TypeScript Firebase Functions scaffold exists
- runtime is Node 24
- very little business logic is currently implemented in [functions/src/index.ts](/workspace/functions/src/index.ts)
- there is also a Genkit sample

This looks more like an emergent/placeholder deployment surface than the main active backend.

## Frontend Routing and UI Patterns

Primary client routing is in [client/src/core/app.tsx](/workspace/client/src/core/app.tsx).

Notable route families:

- `/`
- `/jobs`
- `/resources/*`
- `/companies`
- `/blog-wise`
- `/wise-up`
- `/profile*`
- `/admin*`
- `/marketing-rules`
- `/employers/*`

UI conventions:

- Radix primitives under `components/ui`
- React Query for data fetching
- `wouter` for routing
- Tailwind-based styling
- lazy-loaded route components

The repo also contains a number of refactored and alternate UI implementations:

- `client/src/refactored/`
- `src/refactored/`
- backup components like `HeroSection.backup.tsx`

These are useful references, but they also increase ambiguity around the canonical implementation path.

## AI and Recommendation Features

This repo contains more AI-related functionality than a typical job board.

Main AI entry points:

- `server/ai.ts`
- `server/anthropic.ts`
- `server/services/aiService.ts`
- `server/services/aiServiceManager.ts`
- `server/services/mlJobMatching.ts`
- `server/services/enhancedJobScoring.ts`
- `client/src/lib/gemini.ts`
- `client/src/services/vertexService.ts`

Capabilities referenced in code:

- CV/professional summary generation
- job description generation
- translation
- image analysis
- recommendation flows
- scoring and matching

This is an important subsystem because it crosses frontend, backend, secrets, rate limiting, and deployment concerns.

## Content and WiseUp

WiseUp is implemented as both UI and API/domain code.

Relevant areas:

- `client/src/pages/WiseUp/`
- `src/pages/WiseUp/`
- `server/wiseup.ts`
- `src/api/v1/routes/wiseup.ts`
- `shared/wiseup-schema.ts`

This indicates WiseUp is treated as a first-class domain inside the product rather than a static marketing page.

## Testing Layout

The repo uses multiple testing modes:

- Vitest in the main root project
- Vitest in `server/`
- Jest config still exists in `client/`
- Playwright for E2E

Test locations include:

- `client/src/__tests__/`
- colocated `*.test.ts(x)` files
- `server/tests/`
- `src/api/test/`
- `tests/e2e/`

Observations:

- testing is heterogeneous
- there is evidence of migration from Jest toward Vitest
- some tests target old or duplicate code paths

## Tooling and Build Model

### Root build

The root package is the main orchestrator:

- frontend served from `client/`
- backend served from `server/`
- combined dev via `concurrently`
- TypeScript path aliases target `client/src` and `shared`

### Client-local build config

`client/` also contains its own `package.json`, `vite.config.ts`, Jest config, and TS config.

This means the client can be reasoned about as a semi-independent package, but the root build is still the primary execution path for the integrated app.

### Deployment config

- Netlify: [netlify.toml](/workspace/netlify.toml)
- Firebase Hosting/Functions/Emulators: [firebase.json](/workspace/firebase.json)
- Docker/dev container assets: `.devcontainer/`, `docker-compose.yml`

This repo is deployment-flexible, but not deployment-simple.

## Scripts and Operations

The root `package.json` is the operational control plane.

Notable script groups:

- development
  - `dev`
  - `dev:client`
  - `dev:server`

- build
  - `build`
  - `build:client`
  - `build:server`
  - `build:analyze`

- database
  - `db:push`
  - `db:migrate`
  - `db:generate`
  - `db:status`

- testing
  - `test`
  - `test:*`
  - `qa:quick`
  - `qa:all`

- deployment
  - `deploy:prod`
  - `deploy:firebase*`
  - `netlify:*`

- environment and setup
  - `env:*`
  - `setup:ssh`
  - `verify:ssh`

There are also many one-off utility scripts under `scripts/` for deployment validation, environment checks, migration helpers, and Firebase/Netlify workflows.

## Known Architectural Sharp Edges

These are the most important structural caveats for future work:

### 1. Dual frontend code surfaces

`client/src` is the primary frontend, but root `src/` also contains app/page/component code.

Impact:

- easy to change the wrong implementation
- hard to know which page/service is authoritative

### 2. Dual API composition

The backend mounts both:

- `src/api` under `/api`
- direct legacy routes from `server/routes.ts`

Impact:

- route ownership is split
- middleware/auth behavior can differ by route family

### 3. Multiple auth middleware implementations

Auth is implemented in several places with slightly different assumptions.

Impact:

- inconsistent request user shape
- inconsistent role handling
- elevated risk when adding protected endpoints

### 4. Multiple deployment backends

The same product logic is represented in:

- main Express server
- Netlify functions
- Firebase functions
- Data Connect

Impact:

- duplicated backend logic
- multiple operational paths to maintain

### 5. Mixed storage models

The repo uses:

- Drizzle SQL schema
- Firebase/Auth/Admin APIs
- Firestore-related helpers
- Data Connect GraphQL schema
- local file uploads

Impact:

- data ownership can be ambiguous
- integration changes require careful boundary checking

## Practical Orientation for Future Work

If making changes, use this mental model:

- start in `client/` for user-facing UI changes
- start in `server/` for main backend behavior
- check `src/api` before adding new API routes, because versioned routes already live there
- check `shared/schema.ts` before altering data contracts
- check `netlify/functions/` only if the requested behavior is tied to Netlify deployment or serverless routes
- check `functions/` only for Firebase Functions-specific work
- treat `src/` frontend-style code as potentially live but not necessarily canonical

## Recommended Canonical Files to Read First

For rapid orientation, read these in order:

1. [package.json](/workspace/package.json)
2. [vite.config.ts](/workspace/vite.config.ts)
3. [client/src/core/app.tsx](/workspace/client/src/core/app.tsx)
4. [server/server/index.ts](/workspace/server/server/index.ts)
5. [server/routes.ts](/workspace/server/routes.ts)
6. [src/api/v1/index.ts](/workspace/src/api/v1/index.ts)
7. [shared/schema.ts](/workspace/shared/schema.ts)
8. [server/storage.ts](/workspace/server/storage.ts)
9. [server/db.ts](/workspace/server/db.ts)
10. [netlify.toml](/workspace/netlify.toml)

## Bottom Line

This codebase is best understood as a layered product workspace with one primary app path and several parallel/legacy/platform-specific paths:

- primary browser app: `client/`
- primary integrated backend: `server/`
- shared contract layer: `shared/`
- active secondary API layer and overlapping app code: `src/`
- deployment/runtime variants: `netlify/functions/`, `functions/`, `dataconnect/`, `scrapy_jobs/`

The repo is feature-rich and operationally flexible, but architectural consolidation has not yet caught up with feature growth. Any substantial refactor should begin by deciding which of the parallel paths are canonical and which are legacy or transitional.
