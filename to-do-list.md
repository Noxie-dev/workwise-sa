# WorkWise SA Uniform Completion Plan

This checklist turns the repo from mixed maturity into a single, production-ready system. The phases are ordered so we stabilize architecture first, then remove mock/demo behavior, then complete end-to-end product flows, then harden operations and quality.

## Success Criteria

- [ ] One canonical frontend path, one canonical backend/API path, and one canonical deployment story are documented and enforced
- [ ] No user-facing production flows depend on mock/demo/placeholder data
- [ ] Core candidate, employer, admin, content, and ingestion journeys work end to end
- [ ] Authentication, authorization, file upload, and profile persistence use real identity mapping
- [ ] CI-quality checks exist for lint, types, unit/integration tests, E2E, and deployment validation
- [ ] README and technical docs reflect the final architecture instead of the current transitional state

## Phase 0: Baseline And Decision Record

- [x] Create a repo-wide maturity matrix covering `client/`, `server/`, `src/`, `functions/`, `netlify/functions/`, `shared/`, and `scrapy_jobs/`
- [x] Tag every route, service, and page as `production`, `partial`, `mock-backed`, `duplicate`, or `retire`
- [x] Decide and document the canonical runtime paths:
  - [x] frontend owner: `client/`
  - [x] backend owner: `server/` plus approved `src/api/v1` subset, or full migration away from one side
  - [x] serverless owner: Firebase or Netlify, not both as first-class production paths
- [x] Define “done” for each product surface: jobs, applications, employer tools, profile/CV, WiseUp, AI, scraping
- [x] Add an architecture decision record summarizing what stays, what moves, and what gets removed

## Phase 1: Architecture Consolidation

- [x] Audit overlap between `server/routes.ts`, `server/routes/index.ts`, and `src/api/v1`
- [x] Choose a single API ownership model and map every current endpoint to its destination
- [x] Remove or deprecate duplicate route registrations and conflicting middleware chains
- [x] Audit overlap between `client/src` and root `src/` frontend-style code
- [x] Move any still-needed root `src/` frontend code into `client/` or retire it
- [ ] Remove dead backup/refactor artifacts once replacements are verified
- [x] Update imports, aliases, and build scripts to reflect the chosen canonical layout
- [x] Update `README.md` and `idex.md` after consolidation decisions are implemented

## Phase 2: Eliminate Mock, Demo, And Placeholder Behavior

- [x] Inventory all mock/demo/placeholder paths found in frontend, backend, and serverless code
- [ ] Replace backend mock fallbacks in [server/routes.ts](/workspace/server/routes.ts) with real data access or explicit failure handling
- [x] Replace placeholder user mapping in [server/routes/jobApplications.ts](/workspace/server/routes/jobApplications.ts) with real Firebase UID to DB user resolution
- [ ] Replace mock Firebase fallbacks in [server/firebase.ts](/workspace/server/firebase.ts) and [src/firebase.ts](/workspace/src/firebase.ts) with environment-aware real implementations
- [x] Remove mock dashboard responses from [client/src/services/dashboardService.ts](/workspace/client/src/services/dashboardService.ts) and [src/services/dashboardService.ts](/workspace/src/services/dashboardService.ts)
- [x] Replace mock categories and companies in [client/src/components/CategoriesSection.tsx](/workspace/client/src/components/CategoriesSection.tsx) and [client/src/components/CompaniesSection.tsx](/workspace/client/src/components/CompaniesSection.tsx)
- [ ] Replace placeholder company/job media URLs such as `via.placeholder.com` with stored assets or deterministic fallbacks
- [ ] Review Netlify functions for mock Firebase behavior and either productionize or retire them
- [ ] Remove “coming soon” UI and placeholder form sections unless they are intentionally hidden behind feature flags

## Phase 3: Complete Core Candidate Flows

- [x] Finish job details page and verify route/data contract alignment
- [x] Finish job application submission flow end to end
- [x] Finish application history and application status tracking
- [ ] Finish profile read/update flows, including avatar/file upload
- [ ] Finish CV/profile generation, persistence, and retrieval flows
- [ ] Ensure favorites/saved jobs work across API, database, and UI
- [ ] Verify authentication persistence across refresh, logout, email link, and protected routes
- [ ] Add empty, loading, error, and unauthorized states for all candidate-facing flows

## Phase 4: Complete Employer And Admin Flows

- [x] Replace employer dashboard mock data with real API-backed data
- [ ] Complete create/edit/publish/archive job posting flows
- [ ] Complete employer-side application review and candidate management flows
- [x] Complete role-based access control for employer and admin features
- [x] Remove hardcoded admin checks and move role resolution into database/custom claims
- [ ] Validate analytics/dashboard widgets against real backend metrics instead of simulated updates
- [ ] Confirm payment/subscription features are either fully implemented or clearly removed from scope

## Phase 5: Stabilize Shared Contracts And Data Layer

- [x] Reconcile Drizzle schema, Zod schemas, API responses, and frontend types
- [x] Remove contract drift between `shared/`, `server/`, `src/api`, and client services
- [x] Audit database support strategy and decide whether SQLite remains dev-only or first-class
- [x] Add missing indexes and migration fixes noted in prior audit docs
- [ ] Ensure every protected write flow has transactional integrity where needed
- [ ] Add seed data and test fixtures for canonical local development

## Phase 6: Rationalize AI, Content, And Scraping Subsystems

- [x] Decide which AI features are production features versus experiments
- [x] Replace placeholder AI responses in [server/services/aiService.ts](/workspace/server/services/aiService.ts) with real provider-backed implementations or remove those endpoints
- [x] Standardize WiseUp data ownership across API, UI, and storage layers
- [x] Review scraping source coverage, robots/compliance handling, and ingestion reliability
- [x] Define source-level readiness for Gumtree, Job Mail, Bizcommunity, and any other active spiders
- [x] Add observability for scraper runs, normalized output quality, and ingest failures
- [x] Ensure ingestion contracts in `shared/` are versioned and validated before persistence

## Phase 7: Deployment And Environment Unification

- [x] Choose the primary production deployment path: Express app, Firebase, or Netlify-led architecture
- [x] Remove or demote unused deployment targets from the main developer workflow
- [x] Consolidate environment variable requirements and remove ambiguous fallbacks
- [x] Make `pnpm run dev`, `build`, `start`, and deployment scripts reflect the chosen runtime model
- [x] Verify file storage, auth credentials, secrets, and external service wiring in every supported environment
- [x] Add a production-readiness checklist for environment setup, secrets rotation, backups, and rollback

## Phase 8: Quality Gates, Testing, And Observability

- [ ] Define minimum test coverage for critical candidate, employer, admin, AI, and ingestion flows
- [ ] Add missing backend route tests for applications, profile, auth mapping, uploads, and permissions
- [ ] Add missing frontend tests for job details, application flow, employer actions, and failure states
- [ ] Expand Playwright coverage to full user journeys, not just search/smoke cases
- [ ] Add CI gates for `lint`, `type-check`, `test`, and selected E2E suites
- [ ] Add structured monitoring for API errors, background jobs, scraper runs, and auth failures
- [ ] Add release verification steps for staging and production

## Phase 9: Cleanup, Documentation, And Exit Criteria

- [ ] Remove archived or superseded code paths that are no longer part of the canonical architecture
- [ ] Remove stale docs that describe obsolete routes, runtimes, or workflows
- [ ] Rewrite `README.md` so it describes the finished architecture, not the transitional one
- [ ] Publish a final repo map with canonical folders, commands, and ownership boundaries
- [ ] Run a full regression pass across candidate, employer, admin, WiseUp, AI, and scraping workflows
- [ ] Mark the repo “uniformly complete” only after all success criteria at the top of this file are checked

## Suggested Execution Order

- [ ] Execute Phase 0 before writing any large refactors
- [ ] Execute Phases 1 and 2 before adding major new features
- [ ] Execute Phases 3 and 4 in parallel only after API ownership is settled
- [ ] Execute Phases 5 through 8 continuously alongside feature completion
- [ ] Execute Phase 9 only after staging validation passes
