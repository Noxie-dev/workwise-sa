# Production Readiness Checklist

Use this before promoting a release on the canonical Express deployment path.

## Environment

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` points to PostgreSQL, not SQLite
- [ ] `PORT` is set for the target platform
- [ ] `FILE_SERVE_URL` matches the public file-serving origin
- [ ] `UPLOAD_DIR` points to writable storage or an approved mounted volume
- [ ] `VITE_API_URL` points to `/api` or the canonical API origin
- [ ] `VITE_USE_FIREBASE_EMULATORS=false`
- [ ] `VITE_USE_MOCK_PUBLIC_DATA=false`

## Secrets And Credentials

- [ ] Firebase project config is set
- [ ] Firebase Admin credentials are available through the deployment environment
- [ ] `GOOGLE_GENAI_API_KEY` is set if production AI features are enabled
- [ ] `SCRAPING_INGEST_TOKEN` is set if scraper ingest is enabled
- [ ] any email/SMS/provider credentials are present for enabled features
- [ ] secrets are stored in a secret manager or deployment platform secret store, not plain committed files

## Database And Storage

- [ ] latest migrations have been applied
- [ ] SquareJUMP migration `0013_add_squarejump_foundations.sql` has been rehearsed on a production-shaped snapshot
- [ ] every canonical job has a non-null unique JUID and source occurrences remain traceable
- [ ] score-policy activation and rollback have been rehearsed
- [ ] backup policy exists for PostgreSQL
- [ ] restore procedure has been tested
- [ ] file upload storage has retention and cleanup rules
- [ ] storage paths are included in backup or recovery planning where needed

## Validation

- [ ] `pnpm run build`
- [ ] `pnpm run env:check-prod`
- [ ] smoke-test the API root, auth, jobs list, job details, application flow, and employer dashboard
- [ ] verify uploads and file retrieval
- [ ] verify Firebase auth sign-in and protected API access
- [ ] verify scraper ingest remains gated by source readiness and token checks
- [ ] run the dedicated SquareJUMP release worker and alert on retries/dead-letter records
- [ ] verify subscriber, member, and public release gates with urgent-job exceptions
- [ ] verify recommendation exposure tokens, event deduplication, and notification consent withdrawal
- [ ] confirm `ENABLE_SQUAREJUMP_SEMANTIC` and `ENABLE_SQUAREJUMP_BEHAVIOURAL` remain off until their data gates pass

## Rollback

- [ ] previous release artifact is retained
- [ ] previous database migration state is understood before rollout
- [ ] rollback owner and communication path are named
- [ ] post-deploy monitoring window is assigned
