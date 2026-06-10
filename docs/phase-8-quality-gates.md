# Phase 8 Quality Gates

## Minimum Coverage Targets

These are the minimum gates the repo should keep green on the canonical runtime path.

- lint: root ESLint must pass
- type safety: root `type-check` remains advisory until legacy debt is retired, but backend and test-critical surfaces should not regress
- backend unit/integration: auth mapping, applications, ingest, and file upload routes must have automated tests
- frontend component/page: jobs, job details, dashboard, employer dashboard, and auth guards must retain targeted test coverage
- browser E2E: at least one anonymous jobs journey and one authenticated-protected-route journey must run in Playwright

## Canonical Browser Flow

The first required browser E2E flow is now:

1. anonymous user opens the app
2. navigates to jobs
3. performs a search
4. opens a job preview
5. sees the auth gate instead of full details

This flow is implemented in [tests/e2e/jobs-auth-gate.spec.ts](/workspace/tests/e2e/jobs-auth-gate.spec.ts).

## CI Expectations

The canonical CI path should run:

- `pnpm run lint`
- `pnpm run type-check`
- `pnpm run test:unit`
- `pnpm run test:integration`
- `pnpm run test:api`
- a focused Playwright browser test against the local canonical app runtime

Current implementation truth:

- `test:unit` is the canonical backend gate
- `test:integration` currently aliases that same maintained backend suite so CI stays stable while older network-style integration files are rewritten
- `test:api` is the focused ingest/API route check inside the unit-safe harness
- obsolete demo-style and bind-to-port backend tests have been removed rather than preserved as misleading fallback coverage

Broader staging, visual, and accessibility suites can remain additional layers, but they should not be the only browser verification path.
