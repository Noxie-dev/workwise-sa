# T-Square Production Readiness Audit

**Audit date:** 2026-07-24 (UTC)
**Repository:** `/workspace`
**Branch:** `codex/shared-layout-visuals`
**Commit:** `d7b8652` (`security: add non-printing session secret rotation`)
**Requested output:** `T-Square_ProRead-Report.md`
**Audit mode:** Read-only review, local builds, static analysis, safe local test execution, and isolated local startup. No deployment, destructive migration, credential use against live services, scraping, messages, or paid API requests were performed.

## 1. Executive decision

### Verdict: **NOT READY**

**Overall readiness score: 28/100** *(unchanged after the latest `<3>` batch; P0 authorization and infrastructure caps still apply)*
**Confidence: High** for repository, build, local runtime, access-control, migration, and upload-boundary findings; **medium** for live infrastructure, provider, legal, mobile-device, and disaster-recovery conclusions because no production environment or contracts were supplied.
**Latest execution checkpoint:** `d7b8652` — a non-printing Secret Manager rotation/verification command and startup-hygiene regression test are in place; local dry-run and hygiene checks pass, but the real rotation is blocked because this runner has no Google ADC, so P0-02 remains open and the score remains 28/100 with High/medium confidence.

| Severity | Count | Launch effect |
|---|---:|---|
| P0 — critical production blocker | 5 | Production must not launch |
| P1 — high production blocker | 15 | Critical journeys and operational controls are unsafe or non-reproducible |
| P2 — material readiness gap | 18 | A controlled launch would still carry material reliability, trust, compliance, and revenue risk |
| P3 — improvement | 5 | Cleanup and optimization after blockers are resolved |

The scoring rules cap this repository below 39 because server-side authorization is bypassable or absent on privileged/owned resources. The score is not reduced because the build fails—the build succeeds—but because the built product cannot be served by the documented production process and multiple P0 controls fail.

### Top five blockers

1. **A non-placeholder Firebase Admin service-account private key is tracked in Git.** The file `workwise-sa-project-firebase-adminsdk-fbsvc-727ba80ab5.json` contains a real service-account structure and private key. It must be revoked/rotated and purged from all Git history and derived artifacts.
2. **Public registration permits privilege self-assignment.** `insertUserSchema` accepts `role` and `firebaseUid`; both `/api/users/register` and `/api/v1/users/register` persist those caller-controlled values. An attacker can register their own Firebase UID with an `admin` role.
3. **CVs, profile images, file metadata, deletion, and sensitive profiles lack authentication and ownership checks.** Caller-supplied numeric IDs are trusted and uploads are publicly served.
4. **The documented production runtime does not serve the frontend.** `dist/public` builds, but `server/server/index.ts` never mounts `serveStatic`; local validation returned API JSON at `/` and 404 at `/jobs`.
5. **The production PostgreSQL migration path is not executable from the repository.** The runner sends SQLite-specific SQL such as `INTEGER PRIMARY KEY AUTOINCREMENT` to PostgreSQL, while CI explicitly invokes that path against PostgreSQL.

### Safest launch recommendation

Do not expose this application to public traffic or real personal information. Revoke the committed credential immediately, close the identity/ownership failures, replace the migration chain with a verified PostgreSQL baseline, make the deployment serve one coherent frontend/API artifact, remove production mock fallbacks, and prove backup/restore plus monitoring before any pilot. After those actions, run a limited staging pilot with synthetic data, independent penetration testing, WCAG testing on low-cost Android devices, and qualified South African privacy/legal review. Only then consider a small production cohort with scraping, paid AI, SMS, billing, and advertising disabled by default.

### Weighted score

| Category | Weight | Score | Evidence summary |
|---|---:|---:|---|
| Security and access control | 15 | 3 | Tracked credential; self-assigned admin role; unauthenticated file/profile paths; cross-employer access; open CORS; no Helmet |
| Reliability and error handling | 10 | 3 | Server starts with Firebase unavailable, frontend 404, local-disk state, incomplete shutdown |
| Data integrity and migrations | 10 | 2 | SQLite chain passes; canonical PostgreSQL chain is syntactically incompatible; ownership columns/constraints are incomplete |
| Build and deployment | 10 | 3 | Frozen install and build pass; production serving, environment validation, CI, and deployment contract do not |
| Testing and release protection | 10 | 4 | 156 unit/client tests pass; critical auth, PostgreSQL, startup, backup, accessibility, and real E2E gates are missing |
| Privacy and POPIA readiness | 10 | 2 | Policy copy exists; enforceable rights, retention, consent, operator records, and secure CV handling are absent |
| Observability and incident response | 8 | 1 | Structured logger exists; monitoring services are unmounted; no public readiness, alerts, trace backend, or incident proof |
| Performance and scalability | 7 | 4 | Route lazy loading/build splitting exist; very large images/chunks, local state, in-memory rate limits, and unbounded reads remain |
| Frontend usability and accessibility | 5 | 2 | Loading/error states exist in places; no executed accessibility suite and protected/navigation paths drift |
| SEO and job discovery | 5 | 1 | Titles/descriptions exist; no sitemap/robots/canonical/JobPosting schema; job details require auth |
| Scraping and ingestion governance | 5 | 3 | Registry, robots, throttling, normalization, and dedupe exist; orchestration is public and ingest auth fails open |
| Advertising and commercial readiness | 5 | 0 | Slot/event scaffolding is not an ad platform; events are not persisted and consent/revenue reporting is absent |
| **Total** | **100** | **28** | P0 and server-side authorization caps apply |

## 2. Current repository state

The repository is a mixed-maturity monorepo with 2,297 tracked files, approximately 207 Express route/middleware registrations, several package manifests, four tracked database files, multiple generated/static copies, and multiple runtime histories.

### Canonical path, based on code and accepted ADR

| Concern | Canonical/current owner | Evidence | Actual state |
|---|---|---|---|
| Browser application | `client/` | `vite.config.ts:7-14`; `client/src/main.tsx:5` imports `client/src/core/app.tsx` | Builds to `dist/public`; production Express does not serve it |
| API/backend | `server/` | `package.json` `build:server`; `server/server/index.ts`; ADR 0001 | Express 5 bundle `dist/index.js`; mixes unversioned and `/api/v1` routes |
| Shared types/schema | `shared/` | `@shared` aliases; `shared/schema.ts` | PostgreSQL Drizzle schema coexists with SQLite-oriented migrations |
| Production database | Intended PostgreSQL | `docs/deployment-strategy.md`; CI PostgreSQL service | Migration files are primarily SQLite syntax; not reproducible on PostgreSQL |
| Authentication | Firebase client + Firebase Admin token verification | `client/src/lib/firebase.ts`; `server/middleware/auth.ts` | Server also retains username/password endpoints and role drift |
| File storage | Express local filesystem, with separate Firebase/Cloudflare histories | `server/routes/files.ts`; `/uploads` static mount | Public, unauthenticated, non-durable local disk is canonical for current API |
| Scraping | Python Scrapy subprocess plus Node ingest | `scrapy_jobs/run_scrapers.py`; `/api/v1/jobs/ingest` | Governance exists, but public Express orchestration bypasses operational access control |
| AI | Gemini and Anthropic from Express | `server/routes/cvApi.ts`, `server/ai.ts`, `server/anthropic.ts` | New metered endpoints coexist with public legacy cost-bearing endpoints |
| Monetization | PayFast subscription foundation and ad slot scaffold | `server/routes/billing.ts`, `server/routes/monetization.ts` | Payment code is partial; advertising events are accepted but not persisted |
| Start process | `NODE_ENV=production node dist/index.js` | root `package.json` | Starts API only; can start when authentication is unavailable |

### Legacy, transitional, mock-backed, and ambiguous areas

- `src/api/` and root `src/` are transitional. The accepted ADR says they must move under `server/`/`client/` or be retired, yet `server/routes/v1.ts` still imports the root `src/middleware/rateLimit.ts`.
- `functions/` is a Firebase Functions scaffold; `functions/src/index.ts` exports no active function.
- `netlify/functions/` is a competing Express/serverless runtime and deliberately falls back to fake Firestore, fake Storage, and mock authentication.
- `client/src/App.tsx` duplicates `client/src/core/app.tsx`, but `main.tsx` uses only the latter. The two route maps disagree.
- `prisma/schema.prisma` defines a small unrelated `User` model while Drizzle is the application persistence layer.
- Firebase Data Connect assets and a tracked local PGlite data directory remain, but the canonical Express runtime uses Drizzle/PostgreSQL.
- `public/`, `client/public/`, and `public_backup_old/` duplicate assets; `public/assets` also contains historical hashed bundles.
- Four `.db` files, a compressed documentation archive, Data Connect WAL/base files, root/client/functions/Netlify lockfiles, and generated SDK assets are tracked.
- Production UI code contains explicit mocks. `companyService.ts:54-125` returns mock companies specifically when `import.meta.env.PROD`; `tieredJobsService.ts:125-143` silently returns mock jobs on HTTP or parsing failures.

## 3. Architecture

### Reconstructed current architecture

```mermaid
flowchart LR
  B[Browser]
  CDN[Required static host or reverse proxy<br/>not defined by canonical runtime]
  V[Vite build<br/>client → dist/public]
  E[Express 5<br/>dist/index.js]
  V1[/api/v1 routes<br/>server/routes/v1.ts]
  U[/api routes<br/>server/routes/*]
  FA[Firebase Auth client]
  FAD[Firebase Admin token verification]
  PG[(Intended PostgreSQL)]
  SQ[(SQLite dev/test fallback)]
  DISK[(Local uploads directory)]
  PY[Python Scrapy subprocess]
  ING[Job ingestion service]
  AI[Gemini / Anthropic]
  PF[PayFast]
  R[(Redis optional)]
  SM[Google Secret Manager]
  AD[Ad-slot/event scaffold]
  LOG[Console + local JSON log file]
  LEG[Legacy Netlify/Firebase/Data Connect paths]

  B -->|HTML/JS required| CDN
  V --> CDN
  B -->|Firebase identity| FA
  B -->|HTTP /api| E
  E --> U
  E --> V1
  U --> FAD
  V1 --> FAD
  E --> PG
  E -. development .-> SQ
  U --> DISK
  E -->|public express.static| DISK
  U -->|unauthenticated trigger| PY
  PY -->|optional HTTP ingest| ING
  ING --> PG
  U --> AI
  U --> PF
  E -. optional/fallback .-> R
  E --> SM
  U --> AD
  E --> LOG
  LEG -. conflicting deploy/config paths .-> B

  E -. "BUG: serveStatic is never mounted" .-> V
```

### Runtime ownership map

| Surface | Classification | Owner | Production decision |
|---|---|---|---|
| `client/src/main.tsx` + `client/src/core/app.tsx` | Canonical frontend | Frontend | Retain; merge the duplicate app/router |
| `server/server/index.ts` + `server/routes.ts` | Canonical backend | Platform/API | Retain; harden and serve static artifact or formally split hosting |
| `server/routes/v1.ts` | Transitional, actively mounted | API | Decompose into owned route modules; eliminate duplicate contracts |
| Root `src/` | Transitional/partially referenced | Architecture | Move referenced middleware, archive/remove unreachable UI |
| `functions/` | Legacy scaffold | Platform | Remove from deploy triggers or explicitly document a narrow integration role |
| `netlify/functions/` | Legacy and unsafe mock-backed alternative | Platform/Security | Disable deployments, then archive/remove |
| `dataconnect*` | Partially generated/ambiguous | Data | Decide whether retained; otherwise remove generated/local database state |
| `prisma/` | Unused parallel ORM model | Data | Remove unless an approved migration owns it |
| `public_backup_old/`, historical bundles, archives | Generated/historical | Repository maintainers | Move out of active repository or artifact storage |

### Request and data flows

**Public request flow:** Browser should receive `dist/public/index.html`, execute the React SPA, and call `/api`. The current documented `pnpm start` instead returns API metadata at `/` and a JSON 404 at `/jobs`. Playwright compensates by starting a separate `vite preview`, which is not the documented production contract.

**Authentication flow:** Firebase client signs in, React stores the ID token under two localStorage keys, API calls send `Authorization: Bearer`. Express verifies the Firebase token, then maps it to a SQL user. That mapping can be pre-created by public registration with a caller-controlled Firebase UID and role.

**Upload flow:** A multipart upload goes to Multer temporary disk. Only the reported MIME header is checked, the original extension is retained, data is copied to a caller-selected user/file-type directory, metadata is stored in SQL, and all files are exposed by `/uploads`. No authentication, ownership, signature inspection, antivirus/quarantine, retention, or durable object storage exists.

**Scraper flow:** Express can spawn `python3 scrapy_jobs/run_scrapers.py`; the Python runner checks a source registry, invokes Scrapy, writes raw and normalized local artifacts, applies contact redaction, and optionally posts batches to `/api/v1/jobs/ingest`. Express scraping controls are unauthenticated, and the ingest route accepts all callers when `SCRAPING_INGEST_TOKEN` is missing.

**Advertising flow:** The browser can obtain default slot metadata and send events. The server logs placement/event/session data and responds `persisted:false`. No ad server, consent decision, campaign state, pacing, fraud control, or revenue ledger is present.

**Deployment flow:** Root build generates `dist/public` and `dist/index.js`; root start launches Express. Legacy GitHub workflows still deploy `public/` to Firebase using npm, and `netlify.toml` still maps API traffic to mock-backed serverless functions. The primary path has no production Dockerfile, platform manifest, migration transaction gate, reverse proxy, health/readiness probe, or rollback automation.

## 4. Validation results

| Command / check | Result | What it actually validates | Important output | Production impact |
|---|---|---|---|---|
| `node --version`; `pnpm --version`; `python3 --version` | PASS | Local tool versions | Node 22.23.1, pnpm 10.32.1, Python 3.13.5 | Node matches root engine; Python support is undocumented |
| `CI=true pnpm install --frozen-lockfile` | PASS, 3m18.8s | pnpm lock resolves and native packages build on this Linux/arm64 host | 1,759 packages; warning that `pnpm.overrides` is ignored | Reproducible pnpm install, but ignored override config must be corrected |
| `pnpm run check` | FAIL | Repository sanity script | `unexpected root npm lockfile at package-lock.json` | Repository knowingly violates its package-manager contract |
| `pnpm run type-check` | PASS, about 26s | Root TypeScript program | Exit 0 | Useful compile protection; does not validate runtime ownership/security |
| `pnpm run lint` under 120s timeout | NOT COMPLETED | ESLint/Prettier rules across repo | Exit 124 after two minutes | Lint is not a practical local/CI fast gate as configured; no result obtained |
| `pnpm run test:unit` | PASS, 8.12s | `server/tests/unit` only | 16 files, 53 tests passed | Valuable but narrowly mocked; omits P0 paths |
| `pnpm run test:client` | PASS, 9.57s | Configured `client/src/**/*.test.*` | 16 files, 103 tests passed | Component/unit confidence; no real backend/browser/provider coverage |
| `pnpm run build` | PASS | Vite client and esbuild server bundle | Client 49s; `dist/index.js` 1.3 MB; `dist/public` produced | Build cap does not apply; runtime contract still fails |
| Isolated `db:migrate:test` on fresh SQLite | PASS | SQLite migration sequence and migration ledger | 11 applied, 0 skipped | Local fallback is reproducible |
| Static PostgreSQL migration review | FAIL | Canonical SQL dialect compatibility | `0001`/`0002` use `AUTOINCREMENT`; CI feeds them to PostgreSQL | Fresh production DB cannot be built from migrations |
| `pnpm run env:check-prod` with required dummy names | FALSE PASS | Small subset of production variables | Passes without Admin credentials, `SESSION_SECRET`, `ANTHROPIC_API_KEY`, `PORT`, ingest token, PayFast values | Validator does not match startup or enabled feature contract |
| `node scripts/validate-primary-runtime.js` | FALSE PASS | Only three env names plus artifact existence | Warns about missing AI/ingest/file URL, then validates | Does not start server, query health, inspect frontend serving, or prove dependencies |
| Isolated `node dist/index.js` startup | DEGRADED/FAIL | Built server behavior with local SQLite and no live calls | Logs full session secret; Firebase fails after retries; Redis secret lookup fails; WiseUp seed fails; server still listens | Readiness is reported implicitly although auth/cache/data initialization failed |
| Local `curl /` and `curl /jobs` | FAIL product contract | HTTP behavior of built server | `/` = API JSON 200; `/jobs` = JSON 404; `Access-Control-Allow-Origin:*`; `X-Powered-By` exposed | Canonical launch would not serve the product UI |
| `pnpm audit --prod --audit-level moderate` | FAIL | Actual pnpm production graph | 96 advisories: 2 critical, 38 high, 49 moderate, 7 low | Requires exploitability triage and dependency updates |
| `npm audit --omit=dev --audit-level=moderate` | FAIL | Conflicting npm lock graph | 11 advisories: 3 high, 8 moderate | Different results prove lockfile/supply-chain drift |
| `python3 -m pip check` | NOT RUNNABLE | Installed Python dependency consistency | System Python has no pip module | Python environment is not bootstrappable from current root workflow |
| `python3 -m unittest discover` | FAIL | Attempts Python tests using unittest | Import failure; with `PYTHONPATH`, zero tests because tests use pytest functions | Scraper tests are not wired into a working command/CI job |
| `pnpm run test:e2e:browser` | FAIL before test execution | Focused Chromium journey | Browser executable absent; 2 tests failed to launch | E2E behavior not verified locally; CI installation step remains unproven here |
| Git status after audit | PASS | Audit did not alter tracked source | Clean | Report is the only intended new tracked artifact |

### Dependency advisory interpretation

Not all 96 pnpm advisories are equally exploitable. The two critical advisories are transitive: `protobufjs` through Google Secret Manager would require an applicable untrusted protobuf/schema path, and `websocket-driver` is under Firebase Realtime Database code not demonstrated as a canonical server endpoint. They are material supply-chain gaps, not independently classified P0 here. Higher practical exposure exists in the runtime `drizzle-orm` SQL-identifier advisory, Express/router `path-to-regexp` denial of service, and `ws` memory issues. The repository must upgrade and then regression-test; it must not blindly apply a force update.

## 5. Production blockers

| ID | Severity | Finding | Evidence | Impact | Required fix | Effort | Owner | Verification |
|---|---|---|---|---|---|---|---|---|
| P0-01 | P0 | Live Firebase Admin credential tracked | `git ls-files`; non-placeholder `private_key_id` and `private_key` in `workwise-sa-project-firebase-adminsdk-fbsvc-727ba80ab5.json` | Project compromise, data/token administration, unlawful PI access | Revoke/rotate, investigate access logs, purge all history/artifacts/caches, add secret scanning | M | Security/Platform | Old key rejected; history scanner clean; incident record closed |
| P0-02 | P0 | Full session secret logged at startup | `server/server/index.ts:20-21`; local built startup printed the supplied secret | Session forgery if this secret is active and logs are accessible | Remove secret logging; rotate secret; add redaction tests and log scanning | S | Backend/Security | Startup logs contain names/status only; canary secret absent |
| P0-03 | P0 | Public privilege self-assignment | `shared/schema.ts:31-48`; `publicApi.ts:245-255`; `v1.ts:361-390` | Attacker binds own Firebase UID to `admin`/`employer`; privilege escalation | Separate public registration DTO; server-set role/user IDs; trusted admin-only role workflow; migrate/audit accounts | M | Identity/API | Negative API tests for `role`, `firebaseUid`, admin claim; account audit |
| P0-04 | P0 | Unauthenticated profile/file IDOR and public CV storage | `profile.ts:82-134`; `files.ts:39-398`; `index.ts:55-56` | Read/change/delete others’ identity data and CV metadata; upload abuse; POPIA exposure | Authenticate all paths, resolve identity from token, enforce ownership/admin, private object storage, signed downloads | L | API/Security/Privacy | Cross-user tests return 403/404; anonymous requests 401; files not publicly enumerable |
| P0-05 | P0 | Employer scope is platform-wide, not tenant-owned | `employer.ts:141-229,231-393,395-425`; `jobApplications.ts:318-354` | Any employer reads applicant email/notes and changes any employer’s jobs/applications | Add employer/company/job ownership model and predicates to every query/mutation | L | API/Data/Privacy | Two-tenant integration suite proves isolation for all CRUD paths |
| P1-01 | P1 | Canonical production server omits frontend | `server/vite.ts:70-84` exists but has no caller; `index.ts`; local `/jobs` 404 | Main product unavailable after documented deploy | Mount static SPA after API routes or define/test a separate static host/reverse proxy | M | Platform/Frontend | Built start returns HTML 200 for `/` and `/jobs`; assets and API work |
| P1-02 | P1 | PostgreSQL migrations are unreproducible | `0001:3`, `0002:3` SQLite syntax; runner `sqlMigrations.ts:112-154`; CI uses PostgreSQL | Fresh deploy/restore fails; schema drift and data risk | Establish PostgreSQL-only baseline/migrations; dialect tests in ephemeral PostgreSQL | L | Data/Platform | Empty PostgreSQL migrate, rerun, rollback/restore, schema diff all pass |
| P1-03 | P1 | Production starts in a degraded state and env validator is false assurance | `index.ts:23-44,97`; `firebase.ts:99-131`; validators omit actual preloaded secrets; observed startup | Auth can be unavailable while process listens; startup depends on undocumented Secret Manager entries | One typed config schema; feature gates; fatal readiness dependencies; no implicit secret lookups | M | Platform/SRE | Missing required dependency prevents ready state; validator/startup contract tests |
| P1-04 | P1 | Scraper orchestration is public | `routes.ts:49-50`; `scraping.ts:52-246`; trigger spawns process at `248+` | Remote resource exhaustion, source-policy breach, log exposure | Admin/service authentication, authorization, durable job queue, quotas, cancellation by process handle | M | Data Platform/Security | Anonymous 401; non-admin 403; concurrency/queue tests |
| P1-05 | P1 | Ingest authentication fails open | `v1.ts:46-59`: no configured token returns `true`; env validator only warns | Anyone can ingest up to 500 jobs/batch and poison catalog | Fail closed; require rotated service identity/token; network restriction; per-source scopes | S/M | API/Security | Missing token config disables endpoint; invalid/missing token 401 |
| P1-06 | P1 | Legacy AI routes are public and unmetered | `cvApi.ts:193-308`; no auth/rate limit; provider calls in `ai.ts`/`anthropic.ts` | Cost abuse, PII transfer, prompt injection, DoS | Remove routes or require auth, entitlement, size limits, metering, provider privacy controls | M | AI/API/Security | Anonymous 401; quota/idempotency/cost tests; payload limits |
| P1-07 | P1 | Competing password registration is unsafe/broken | `publicApi.ts:245-255` stores raw supplied password; `/api/v1` separately hashes | Plaintext password risk, inconsistent identities, broken login semantics | Remove SQL password auth or implement one audited identity service with hashing/reset/verification | M | Identity/Security | No plaintext passwords; lifecycle integration tests |
| P1-08 | P1 | Candidate can set their own application outcome | `jobApplications.ts:200-229`; ownership permits update and schema accepts `hired`/`rejected` | Fraudulent funnel, analytics, employer workflow, and revenue data | Split candidate withdrawal/notes from employer-only status transition APIs | M | API/Product | Candidate status mutation 403; state-machine tests |
| P1-09 | P1 | Production silently presents mock data as real | `companyService.ts:54-125`; `tieredJobsService.ts:125-143`; built `mockData` chunk | Misleading job/company inventory, user harm, commercial/reporting fraud | Eliminate production mock paths; fail visibly; dev-only dependency injection | M | Frontend/Product | API failure shows error/empty state; production bundle excludes mock fixtures |
| P1-10 | P1 | Upload validation/storage is unsafe and non-durable | `files.ts:12-34` trusts MIME; retains extension; local disk; no AV/signature; `/uploads` public | Malware/polyglot files, privacy breach, data loss on restart/scale/deploy | Private object storage, magic-byte validation, quarantine/AV/CDR, signed URLs, retention/deletion | L | Security/Platform | Malicious file suite; multi-replica/redeploy persistence; deletion audit |
| P1-11 | P1 | No verified backup, restore, monitoring, alerts, or readiness | `docs/production-readiness-checklist.md` items unchecked; metrics middleware/services unmounted | Undetected outage/data loss; no defensible recovery | Implement telemetry, SLOs, alerts, backup schedule, encrypted object/database backups, restore drills | L | SRE/Data | Alert exercise and timed restore meet RPO/RTO |
| P1-12 | P1 | Runtime dependency graph has exposed high-risk advisories | pnpm audit: 96; includes Drizzle, Express path matching, ws; overrides warning | Injection/DoS/supply-chain exposure | Unify lockfile, upgrade direct/transitive packages, create advisory exceptions with exploitability evidence | M | Platform/Security | Clean agreed audit threshold; SCA gate; regression suite |
| P1-13 | P1 | CI/deployment paths conflict and contain placeholders | QA workflow mixes pnpm/npm; staging deployment is `echo`; Firebase workflows deploy legacy `public/`; no canonical production deploy proof | Wrong runtime can deploy; gates can skip/fail; no reproducible rollback | Replace with one primary pipeline: install, lint, tests, PostgreSQL migrate, artifact, deploy, smoke, rollback | L | Platform/SRE | Clean-clone pipeline deploys staging and performs rollback drill |
| P1-14 | P1 | POPIA operational controls are absent | Policy promises rights; no account deletion/export/correction/consent/retention implementation found | Rights requests cannot be fulfilled; over-retention and unlawful processing risk | Data map, lawful-basis/consent records, DSAR workflows, retention jobs, operator contracts, breach process | L | Privacy/Legal/Product | Synthetic access/export/delete/correction requests pass; legal sign-off |
| P1-15 | P1 | Primary Express security baseline is missing | `index.ts:48` unrestricted CORS; no Helmet/rate limiter/body policy/trust-proxy config; observed headers | Broader browser abuse/DoS and missing defense-in-depth | Allowlist CORS, Helmet/CSP, global/distributed rate limiting, proxy config, body/time limits | M | API/Security | Automated header/CORS/rate-limit tests behind real proxy |

All P0/P1 findings have **high confidence** except live-provider exploitability portions of P1-12 and legal consequence portions of P1-14, which are **medium confidence** pending environment and legal review. Likelihood is high for internet-reachable P0-03/04 and P1-04/05/06/09/15, medium for the remaining blockers. Impact is high or critical by definition.

## 6. Domain findings

### Repository hygiene

- **P0-01:** A live-looking service-account credential is tracked. The second `service-account.json` is a placeholder, but its presence also encourages a filesystem fallback.
- **P2-01:** Parallel runtimes and duplicated app routers obscure ownership. The accepted ADR documents this but migration is incomplete.
- **P2-02:** Root `package-lock.json`, `pnpm-lock.yaml`, client/functions/Netlify npm locks, four `.db` files, Data Connect PGlite/WAL state, archives, old public bundles, and duplicate assets are tracked. Root `pnpm run check` fails because of this.
- **P3-01:** Generated/historical image copies include a 2.7 MB hero image in three locations; repository clones and reviews carry unnecessary weight.
- No merge-conflict markers were found. Git was clean before the report was created.

### Dependencies and supply chain

- **P1-12:** Production audit fails. Actual pnpm and stale npm graphs disagree by 85 advisories.
- Root declares `pnpm@10.32.1`, but pnpm warns that the nested `pnpm.overrides` section is ignored. A separate root `overrides` block may still apply, making intent ambiguous.
- Python scraping requirements are pinned, but the unrelated root ML requirements are mostly unpinned and include a CUDA-specific Torch wheel. There is no declared Python version, virtual environment command, hash lock, license inventory, or Python SCA job.
- **P3-02:** Eleven deprecated JavaScript subdependencies were reported during install.
- Licensing was not fully verified. Root is MIT, but no automated third-party license allow/deny report exists.

### Frontend

- **P1-09:** Job/company services can mask production failures with believable fixtures. Company search explicitly chooses mocks in production.
- `main.tsx` uses `core/app.tsx`; duplicate `App.tsx` has additional routes such as `/companies/:slug` and `/terms-of-service` that are absent from the live router.
- Admin/employer routes are not wrapped at the router level, though some pages perform local role checks. Client checks are not a security boundary and navigation behavior is inconsistent.
- React Query defaults include `staleTime: Infinity` and retries disabled globally (`queryClient.ts:48-59`), risking permanently stale data and poor transient-network recovery.
- Firebase tokens are duplicated in localStorage (`AuthContext.tsx:27-40`), increasing XSS token-theft impact (**P2-03**).
- **P3-03:** `HelmetProvider` and `QueryClientProvider` are mounted in both `main.tsx` and `core/app.tsx`; the production build also emits a query-devtools chunk because the module is statically imported.

### Backend and API contracts

- **P0-03/04/05 and P1-04/05/06/07/08/15** are the controlling backend findings.
- The API is duplicated between `/api` and `/api/v1`; security posture differs. `/api/v1` has an in-memory general limiter, while unversioned file/profile/scraping/legacy AI routes do not.
- `hasValidIngestToken` fails open, while documentation says ingest is “protected.”
- Swagger is mounted, but no evidence shows it matches all 207 route registrations or frontend calls. Compatibility routes significantly exceed documented ownership.
- **P2-04:** Error handling is stronger than average (request IDs and production 5xx masking), but request IDs accept unvalidated client strings, logs include stack traces for routine 4xx errors, and several routes return raw provider error messages.
- **P2-05:** Graceful shutdown closes only cache and calls `process.exit`; it does not stop accepting HTTP requests, drain the server, or close PostgreSQL/SQLite/log streams explicitly.

### Database and data integrity

- **P1-02:** Production migration chain is not PostgreSQL-safe.
- Drizzle schema uses `pgTable`, but SQLite is initialized with that schema through `drizzle-orm/better-sqlite3`; the isolated startup produced `no such function: now` during WiseUp seeding.
- Migration 0011 drops multiple billing tables/columns without conditional column drops or a demonstrated rollback. It succeeded on the tested SQLite version but has not been proven on PostgreSQL or existing production variants.
- Jobs have no employer/owner foreign key, making tenant enforcement impossible without schema work (**P2-06**).
- Role and status values are unconstrained text. Application transitions are not a database-enforced state machine.
- Monetary billing values use integer cents and default `ZAR`, which is the correct representation foundation. Job salary remains free-form text and cannot support numeric salary analytics reliably.
- Several storage methods load whole tables (`getUsers`, `getJobs`, employer dashboard/analytics) and filter in application memory, limiting scale and leaking scope if authorization is missed.

### Authentication and authorization

- **P0-03:** Caller-controlled role/Firebase UID is a direct escalation path.
- **P0-04/05 and P1-08:** Ownership/tenant enforcement is absent or too broad.
- Firebase failures result in 503 from token middleware, but startup still advertises a listening server.
- SQL password auth coexists with Firebase and does not create a server session/token on login. Registration, email verification, reset, disabled accounts, revocation, account deletion, and role administration do not form one verified lifecycle.
- `authorizeOwnership` depends on a `userId` token claim that ordinary Firebase ID tokens do not inherently contain; database resolution is not used there.

### Application security

- The confirmed secret, privilege, IDOR, upload, unauthenticated compute, and security-header findings map to OWASP Broken Access Control, Security Misconfiguration, Identification/Authentication Failures, Vulnerable Components, and SSRF/DoS-adjacent cost abuse.
- No direct SQL injection from user input was confirmed in application queries; Drizzle parameterization is generally used. The Drizzle dependency advisory still needs upgrade/triage.
- No direct OS command injection was confirmed: the scraping subprocess uses a fixed executable and argument array, and the Python runner allowlists source names. Public triggering is still a resource/governance blocker.
- No source maps were emitted in `dist`, which reduces accidental source exposure.
- **P2-07:** CSP/security headers exist only in legacy `netlify.toml`; they do not protect canonical Express. Its CSP also permits `unsafe-inline` and `unsafe-eval`.

### Uploads

- **P0-04/P1-10** control. Specific defects: MIME header only, original extension retained, GIF/SVG-like active-content risk is not signature-tested, no dimension/decompression limits, no AV/CDR, no quarantine, no ownership, predictable timestamp names, public static URL, local disk, and synchronous filesystem calls.
- `UPLOAD_DIR` is documented and consumed by a separate `fileService.ts`, but the active route hardcodes `uploads/`. This is a configuration/documentation split.

### AI integrations

- **P1-06:** Public legacy Gemini/Claude endpoints can incur cost.
- Prompts interpolate applicant/job content directly and do not isolate untrusted instructions. Output is returned as text without policy/schema validation.
- `ai.ts` and `anthropic.ts` catch provider/config failures and return believable “Unable…” strings as successful results, contradicting `docs/ai-support-matrix.md`’s explicit-failure promise.
- Model identifiers are hardcoded and stale-looking; no provider timeout, circuit breaker, concurrency cap, budget alert, or data-processing/retention configuration is visible.
- The newer `/api/cv/ai/*` routes add auth, entitlements, idempotency, usage events, token/cost estimates, and are the correct foundation.
- **P2-08:** PII/provider disclosure, cross-border transfer, prompt retention, and human-review requirements need privacy/legal review.

### Scraping and ingestion

- Positive evidence: robots obeyed, three-second/random delay, per-domain concurrency two, auto-throttle, retry controls, allowlisted sources, source rollout/ingest flags, contact redaction, normalization, schema version, dedupe constraints/fingerprints, batch cap, retry artifacts, and source URLs.
- **P1-04/05:** Public orchestration and fail-open ingest invalidate those controls as an operational boundary.
- Source registry `robotsCheckedAt` is 2026-03-24 and “reviewed” does not identify reviewer, evidence URL, terms/copyright conclusion, expiry date, or legal approval.
- Raw scraped artifacts retain unsanitized source data on local disk with no encryption/retention controls.
- Cancellation changes only in-memory session state; it does not terminate the child process.
- Sessions disappear on restart and do not support horizontal scaling.
- **P2-09:** The pytest-style scraper tests are not runnable through unittest and no Python CI job exists.
- Scraping legality, terms, robots, copyright, database rights, Cybercrimes Act exposure, and POPIA basis require qualified South African legal review per source. This audit does not declare any source lawful.

### POPIA and privacy

| Control | Status | Evidence / gap |
|---|---|---|
| Privacy notice | Partial | UI policy exists but claims compliance without implementation proof and contains placeholder contact data |
| Purpose/lawful basis | Partial | Narrative only; no processing register or per-purpose records |
| Consent records | Absent | No versioned consent ledger for cookies, ads, AI, marketing, or data sharing |
| Data minimization | Fail | Profiles include ID number/date of birth; public route returns whole profile; no field-level policy |
| Access/correction/export | Partial/absent | Profile update exists but is unauthenticated; no verified export/DSAR flow |
| Deletion/retention | Absent | No account deletion orchestration, retention schedules, purge jobs, legal holds, or deletion audit |
| Direct marketing/unsubscribe | Absent | Notification flags exist; no compliant consent evidence or suppression workflow |
| Children | Narrative only | Policy says 18+; no age gate or guardian flow |
| Operator/cross-border controls | Not verified | Firebase, Google, Anthropic, PayFast, hosting, analytics contracts/locations not supplied |
| Breach response | Absent | No incident runbook, Information Regulator notification workflow, or tested contact tree |
| Security safeguards | Fail | P0 credentials/IDOR/public CV issues |
| Information Officer | Partial | Policy text references one; repository does not evidence registration/contact validity |

**Conclusion:** POPIA readiness is **partially implemented at policy/scaffold level but operationally not ready**. Qualified South African legal review is required after the technical controls exist.

### Advertising, analytics, and monetization

- `defaultAdSlots` and event validation exist, but `/api/monetization/events` explicitly returns `persisted:false`.
- No Google Ad Manager/other ad tag integration, consent platform, ad refresh policy, lazy-load/viewability observer, frequency cap, invalid-traffic control, direct campaign model, creative approval, or advertiser reporting was found.
- No page/session RPM, fill rate, viewability, placement/device/geography revenue, campaign pacing, or ZAR ad revenue ledger exists.
- Employer conversion metrics are computed from application data, but application status is user-mutable and employer scope is global, so it is not commercially trustworthy.
- PayFast billing uses integer ZAR cents, idempotent webhook records, and signature checks—a useful foundation. It still needs production configuration validation, amount/merchant validation, provider callback verification as recommended by PayFast, refund/reconciliation operations, alerting, and end-to-end sandbox evidence.

### Performance and scalability

- Positive: route-level lazy loading, hashed assets, manual chunks, query caching, pagination on some application endpoints, job ingest fingerprints/indexes.
- `dist/public` includes a 2.79 MB hero image; the document/PDF chunk is 538 KB uncompressed, forms 341 KB, React 327 KB, TanStack 303 KB, and charts 239 KB. CSS totals exceed 220 KB uncompressed.
- React Query retry is globally disabled, which is harmful on intermittent South African mobile networks.
- In-memory rate limits, scrape sessions, metrics, and caches are per-process and ineffective under horizontal scale.
- Local uploads/logs do not survive replacement and cannot be shared safely among replicas.
- Employer/admin analytics load entire tables and repeatedly filter arrays (`O(n*m)` patterns).
- No compression middleware, CDN contract, cache headers in canonical Express, load test result, connection pool tuning, or low-end Android performance budget was verified.

### Accessibility

- Radix primitives and many labels/ARIA attributes provide a partial foundation.
- No `tests/accessibility` files exist even though `test:a11y` points there; no axe result, keyboard audit, contrast evidence, screen-reader test, focus-management audit, reduced-motion audit, or WCAG 2.2 AA sign-off was produced.
- `maximum-scale=1, user-scalable=no` in `client/index.html:5` prevents user zoom and is an accessibility failure.
- Some custom controls, charts, modals, and multi-step forms require manual keyboard/screen-reader validation.
- Status: **P2-10, not verified against WCAG 2.2 AA**.

### SEO and job discovery

- Titles/meta descriptions exist on many pages.
- No `robots.txt` or sitemap was found in `client/public` or `public`.
- No canonical URLs, Open Graph/Twitter cards, server rendering/prerendering, or `JobPosting` JSON-LD were found.
- Full job details are intentionally behind authentication (`JobDetails` uses `AuthGuard`; Firestore rules mirror this), preventing search engines from indexing useful job content.
- The current Express runtime does not serve SPA routes at all.
- Expired-job 404/410 behavior, canonical job URLs, crawlable employer pages, and duplicate-content policy are absent.
- Status: **P2-11; materially weak for organic job acquisition**.

### Observability and incident readiness

- The logger produces JSON with request IDs, but writes production logs to local disk and synchronously checks rotation only at initialization.
- `metricsService`, performance middleware, auth-monitoring routes, and health helpers exist but are not mounted by the canonical bootstrap. There is no `/health`, `/ready`, or `/metrics` in active routes.
- No error-tracking SaaS, trace export, uptime checks, alert definitions, dashboards, deploy markers, AI budget alerts, ad/revenue alerts, scraper duplicate alerts, or database/storage capacity alarms were found.
- Logs can include email/phone targets (`smsService`) and complete stack traces; no central redaction policy or retention setting exists.
- No evidence supports answering the brief’s operational questions reliably.

### Infrastructure and deployment

- **P1-01/02/03/11/13/15** control.
- There is no production Dockerfile; `.devcontainer/Dockerfile` and `docker-compose.yml` are development-only and use `sleep infinity`.
- No production platform resource, TLS/reverse-proxy contract, autoscaling policy, writable-volume policy, migration lock, zero-downtime protocol, or rollback artifact promotion exists.
- Firebase hosting workflows run on legacy branches/PRs and use npm; `netlify.toml` is labeled legacy but remains deployable.
- Static and upload cache/security headers live in Netlify config, not primary Express.

### Testing and quality strategy

- Passing configured tests cover logger, file/profile happy paths, job applications/favorites, employer endpoints, billing, entitlement, ingest, database adapter, AI metering, Firebase wrapper, Auth contexts, JobDetails, employer dashboard, form autosave, and salary helpers.
- File/profile route tests validate the current insecure anonymous behavior rather than asserting authentication/ownership.
- `test:integration` is an alias for the same server unit directory; it is not integration testing.
- `test:api` is one ingest unit file.
- E2E contains only two anonymous job-auth-gate cases and did not launch locally because the browser binary was absent.
- No configured tests prove registration/login lifecycle, account recovery/verification/deletion, multi-tenant authorization, employer onboarding, real job CRUD, CV malware handling, PostgreSQL migration, PayFast sandbox, backup/restore, startup readiness, monitoring/alerts, consent, ads, or scraping orchestration security.
- **P2-12:** Numeric test counts overstate business-risk coverage.

### Documentation

- Useful current documents include ADR 0001, deployment strategy, environment verification matrix, route ownership map, mock inventory, database strategy, and readiness checklist.
- `docs/deployment-strategy.md` incorrectly implies the bundled Express application serves `dist/public`.
- `docs/ai-support-matrix.md` says callers receive explicit provider failures, while implementation returns fallback strings.
- Privacy copy says the application “is compliant”; repository evidence cannot support that claim.
- README itself says full type safety is not restored, while current `pnpm run type-check` passes; documents have mixed dates/names (WorkWise SA, TalentSquare, T-Square).
- **P2-13:** Documentation needs a code-verified consolidation; historical guides should move under `archive/`.

### Remaining P2/P3 finding register

| ID | Severity | Finding | Confidence | Likelihood / impact | Effort | Dependencies | Owner |
|---|---|---|---|---|---|---|---|
| P2-01 | P2 | Parallel runtime/router ownership | High | High / maintainability, wrong-path changes | L | ADR migration | Architecture |
| P2-02 | P2 | Lockfiles, DBs, generated/history artifacts tracked | High | High / drift, clone safety | M | Package-manager decision | Maintainers |
| P2-03 | P2 | Firebase ID tokens stored twice in localStorage | High | Medium / token theft after XSS | M | Auth architecture | Identity/Frontend |
| P2-04 | P2 | Error/log behavior is noisy and inconsistently sanitized | High | Medium / PI and operational leakage | M | Logging standard | SRE/Security |
| P2-05 | P2 | Shutdown does not drain HTTP or close DB | High | Medium / failed deploy requests | M | Server/database handles | Backend/SRE |
| P2-06 | P2 | Schema lacks tenant ownership and constrained roles/status | High | High / authorization and integrity | L | Data model | Data/API |
| P2-07 | P2 | Canonical runtime lacks security headers/CSP | High | Medium / defense-in-depth | S | P1-15 | Security/API |
| P2-08 | P2 | AI privacy/prompt/output governance incomplete | High | Medium-high / PI, trust, cost | L | Provider/legal decisions | AI/Privacy |
| P2-09 | P2 | Scraper tests/CI not runnable | High | Medium / ingestion regressions | M | Python toolchain | Data Platform/QA |
| P2-10 | P2 | WCAG 2.2 AA not verified; zoom disabled | High | High / exclusion and legal/reputation risk | L | Design/accessibility audit | Frontend/QA |
| P2-11 | P2 | SEO/job discovery controls absent | High | High / acquisition loss | L | Public job-content decision | Growth/Frontend |
| P2-12 | P2 | Critical business-flow test gaps | High | High / regression risk | L | P0/P1 remediation | QA |
| P2-13 | P2 | Documentation contains false/stale claims | High | High / operator error | M | Canonical architecture | Architecture/Docs |
| P2-14 | P2 | Local/in-memory observability state is unmounted/unscalable | High | High / incident blindness | L | Monitoring platform | SRE |
| P2-15 | P2 | Commercial analytics/ad events are non-persistent | High | High / no revenue accountability | L | Consent/ad platform | Product/Data |
| P2-16 | P2 | Unbounded table reads and N×M in-memory analytics | High | Medium / latency/cost | M/L | Tenant/data indexes | Backend/Data |
| P2-17 | P2 | Stale/expired job lifecycle and 410 behavior absent | Medium | High / user trust/SEO | M | Job status model | Product/Data |
| P2-18 | P2 | Production platform/container/TLS/scale contract absent | High | High / deploy and recovery risk | L | Hosting decision | Platform/SRE |
| P3-01 | P3 | Duplicated large images/static archives | High | Medium / repository and mobile weight | M | Asset policy | Frontend/Maintainers |
| P3-02 | P3 | Deprecated transitive dependencies | High | Medium / maintenance | M | Dependency upgrades | Platform |
| P3-03 | P3 | Duplicate global React providers/devtools import | High | Low / bundle/complexity | S | Router consolidation | Frontend |
| P3-04 | P3 | Browserslist data is 11 months stale | High | Low-medium / targeting drift | S | Lock update | Frontend |
| P3-05 | P3 | Comments/names still refer to WorkWise/demo/mock fallback inaccurately | High | Low / maintainer confusion | S/M | Rebrand/canonical docs | Maintainers |

## 7. Mock, fallback, legacy, and dead-code register

| Path or feature | Classification | Referenced by | Production risk | Recommended action |
|---|---|---|---|---|
| `client/src/core/app.tsx` | Canonical router | `main.tsx` | Missing routes/guards relative to duplicate | Retain and correct |
| `client/src/App.tsx` | Duplicate/unreachable app router | No canonical entry | Route drift and false test/docs assumptions | Merge unique routes, then remove |
| `client/src/services/mockData.ts` | Mock fixture in production bundle | Jobs, companies, home sections | Fake listings conceal outage | Dev/test-only injection; exclude from prod |
| `tieredJobsService` fallback | Unsafe production fallback | Jobs page/E2E | Fake jobs on any API failure | Return explicit typed failure |
| `companyService` production branch | Mock-backed production implementation | Companies UI | Companies are not real in production | Replace with canonical API |
| `jobService.js` | Mock employer job posting/AI | Employer flows | Simulated success and generated text | Remove or dev-only |
| `marketingRuleService.ts` | Mock service | Marketing rules UI | Misleading analytics/config | Build API or remove UI from prod |
| `vertexService.ts` | Mock image processor | Profile UI imports | Fake enhancement | Remove/feature-flag as unavailable |
| `profile.ts` scan/enhance/prompt | Mock API responses | Canonical `/api/profile` | Returns sample identity data as success | Implement securely or 501/disable |
| `jobDistribution.ts` | Random/demo metrics | Dashboard | False reporting | Replace with real queries |
| `smsService.ts` | Stub provider | Public `/sms/preview` | Future live-send abuse; current skipped response | Keep endpoint private; implement audited adapter |
| `/api/monetization/events` | Scaffold | Ad components | Reports accepted but discards data | Disable claims or persist auditable events |
| `server/routes/v1.ts` | Transitional monolith | Canonical bootstrap | Duplicated contracts/security | Migrate to `server/routes/*` modules |
| root `src/` | Transitional | Some server/client imports | Ownership ambiguity | Move referenced code, archive rest |
| `functions/` | Legacy Firebase scaffold | Legacy workflows/config | Accidental unsupported deploy | Remove deploy path; archive if no owner |
| `netlify/functions/` | Legacy mock-backed runtime | `netlify.toml` | Mock auth/data can deploy publicly | Disable/remove immediately |
| `dataconnect/`, generated SDK | Ambiguous partial integration | Firebase tooling/dependency | Schema/data drift and tracked local state | Approve explicit use or remove |
| `prisma/schema.prisma` | Parallel unused ORM | Prisma postinstall only | Misleading schema authority | Remove Prisma dependencies/schema unless owned |
| `firestore.rules`, `storage.rules` | Legacy/platform-specific controls | Firebase config | Do not protect Express/PostgreSQL/local uploads | Retain only if Firebase data/storage remains supported |
| `public/assets`, `public_backup_old` | Generated/historical | Firebase legacy hosting | Stale frontend may be deployed | Move to artifact/archive storage |
| `service-account.json` | Placeholder fallback | `server/firebase.ts` default | Encourages bundled file credentials; startup ambiguity | Remove fallback; use workload identity/secret mount |
| SQLite default | Development fallback | `db.ts`, migration scripts | Can hide PostgreSQL incompatibility | Dev/test only with explicit flag |
| Firebase initialization continuation | Unsafe fallback/degraded mode | `firebase.ts`, startup | Process listens without authentication | Fail readiness/start when auth is required |

## 8. Environment-variable matrix

Secret values were not reproduced. “Validation” refers to effective fail-fast validation, not merely a mention in a script.

| Variable(s) | Required environment | Consumer | Validation present | Secret | Default/fallback | Production risk |
|---|---|---|---|---|---|---|
| `NODE_ENV` | All; `production` in prod | Bootstrap, logger, config | Partial | No | Often development behavior | Incorrect mode enables debug/fallback behavior |
| `PORT` | Production runtime | Bootstrap/secret manager | No effective validation | No | Code says 3001, but preload can make it required in Secret Manager | Startup inconsistency |
| `DATABASE_URL` | Server; PostgreSQL in prod | DB, migration, Drizzle | Partial | Yes | SQLite in non-prod; migration script defaults SQLite | Wrong dialect/data store |
| `SESSION_SECRET` | Intended production | Preload/bootstrap only in observed canonical code | No | Yes | None in production Secret Manager | Logged in full; undocumented startup dependency |
| `FILE_SERVE_URL` | Current upload API | File routes/services | Warning only | No | localhost URL | Incorrect/public file URLs |
| `UPLOAD_DIR` | Intended upload storage | `fileService.ts`, not active upload routes | No | No | `uploads` | False configuration; active routes hardcode paths |
| `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` | Auth/storage | Firebase Admin | Partial | No | Service-account values/derived bucket | Can start degraded when invalid |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase Admin unless workload identity | `server/firebase.ts` | Warning only | Path to secret | Bundled/source-relative placeholder file | File-secret and `__dirname` ambiguity |
| `FIREBASE_SERVICE_ACCOUNT` | Legacy Netlify/scripts | Netlify Firebase helper, env docs | Partial in legacy path | Yes | Mock Netlify Firebase | Must not coexist with canonical Admin credential methods |
| `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID` | Legacy/server docs | Legacy functions/scripts | Fragmented | API key is browser identifier, not server secret by itself | Project defaults | Contract drift |
| `GCP_PROJECT_ID` | Google Secret Manager | `secretManager.ts` | No | No | `workwise-sa-project` | Wrong project secret lookup |
| `GOOGLE_GENAI_API_KEY` | Enabled Gemini | AI service, startup preload | Env validator requires it | Yes | Secret Manager | Unneeded hard dependency if AI disabled |
| `GOOGLE_GENAI_MODEL` | Optional AI model | AI services | No | No | Hardcoded models elsewhere | Uncontrolled model drift |
| `ANTHROPIC_API_KEY` | Enabled Claude; currently startup preload | Anthropic routes/bootstrap | Missing from prod validator | Yes | Secret Manager | Startup failure or public cost abuse |
| `REDIS_URL` | Stable cache/rate-limit architecture | Cache service | Warning/none | Yes | In-memory/degraded behavior | Per-instance state and failed Secret Manager calls |
| `SCRAPING_INGEST_TOKEN` | Must be required if endpoint exists | Node ingest + Python runner | Warning only | Yes | **Fail-open unauthenticated ingest** | Catalog poisoning |
| `WORKWISE_API_BASE_URL` | Scraper ingest | Python runner | No | No | `http://localhost:3001` | Accidental local/wrong-target ingest |
| `SMS_PROVIDER`, `SMS_API_KEY` | Enabled SMS | SMS service | Pair check in one script | API key yes | Stub/skipped | Public endpoint can become send primitive |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` | Enabled billing | Billing service | Runtime-only | Yes | None | Checkout/webhook failure |
| `PAYFAST_SANDBOX` | Billing | Billing service | No | No | Sandbox unless exactly `false` | Accidental sandbox/live mismatch |
| `PAYFAST_RETURN_URL`, `PAYFAST_CANCEL_URL`, `PAYFAST_NOTIFY_URL`, `PUBLIC_BASE_URL` | Billing | Billing service | No | No | localhost-derived URLs | Broken redirects/webhooks |
| `LOG_LEVEL` | Server | Logger | Enum fallback | No | info prod/debug non-prod | Excess PI/noise if debug |
| `ENABLE_EXPERIMENTAL_AI_ENDPOINTS` | Server | `aiRoutes.ts` | In-code gate | No | Disabled | Good gate, but unrelated public legacy AI remains |
| `VITE_API_URL` | Browser build | Client services | Partial | No | Relative or localhost depending service | Services interpret `/api` inconsistently |
| `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Browser auth | `client/src/lib/firebase.ts` | Runtime status; production build can continue disabled | Browser-safe identifiers | Placeholder project values | Product can ship in disabled/demo mode |
| `VITE_USE_FIREBASE_EMULATORS` | Dev only; false prod | Firebase client | Prod validator checks exact `true` | No | False outside `DEV` | Reasonable, but validator does not validate all client config |
| `VITE_USE_MOCK_PUBLIC_DATA` | Dev/test only; false prod | Job/home components | Validator rejects exact `true` | No | Code often treats missing as true; network errors still mock | Fake production data |
| `VITE_AUTH_EMAIL_LINK_SIGN_IN_URL`, `VITE_FIREBASE_DYNAMIC_LINK_DOMAIN`, `VITE_IOS_BUNDLE_ID`, `VITE_ANDROID_PACKAGE_NAME` | Passwordless/mobile flows | Firebase client | No | No | Current origin | Broken/unsafe auth redirects if domains unapproved |
| `VITE_GEMINI_API_KEY` | Client legacy | `client/src/lib/env.ts` | No | **Would be exposed** | None | Never put provider secret in Vite |
| `VITE_GOOGLE_GENAI_API_KEY` | Documented client example | No confirmed canonical consumer | No | **Would be exposed** | None | Misleading and dangerous documentation |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_API_TOKEN`, `CLOUDFLARE_IMAGES_HASH`, `CLOUDFLARE_WEBHOOK_SECRET`, `CLOUDFLARE_R2_*` | Legacy/optional media | Netlify/cloud helpers | Fragmented | Tokens/keys yes | Local/Firebase alternatives | Multiple storage authorities and secret sprawl |
| `CI`, `BASE_URL`, `BRANCH`, `BUILD_ID`, `COMMIT_REF` | CI/tests | Playwright/scripts | CI-provided | No | Local defaults | Test/deploy drift |

Required correction: create one server-side Zod (or equivalent) configuration schema with environment/feature profiles, one separately typed browser-safe schema, and tests that compare every consumer to examples and deployment manifests. Browser keys must never include AI, payment, Admin, database, webhook, or storage secrets.

## 9. Test coverage and release-gate matrix

| Journey | Unit | Integration | API | E2E | Manual | Status | Missing coverage |
|---|---|---|---|---|---|---|---|
| Registration | Partial mocks | No | No secure negative tests | No | Not verified | FAIL | Role/UID mass assignment, duplicate identity, hashing |
| Login/logout/session restoration | Auth context only | No | Legacy login only | No | Not verified | PARTIAL | Real Firebase, expiry/revocation, logout token clearing |
| Email verification/reset/passwordless | Limited utility tests | No | No | No | Not verified | FAIL | Complete lifecycle and redirect allowlist |
| Candidate onboarding/profile | Storage/route happy paths | No | Insecure route tests | No | Not verified | FAIL | Auth, ownership, validation, interrupted save |
| Employer onboarding/tenant setup | No | No | No | No | Not verified | FAIL | Company ownership and approval |
| Job browse/filter | Component/utility partial | No | Public route unit partial | E2E exists but did not launch | Not verified | PARTIAL | Real API, mobile/slow network, no mock fallback |
| Job details | 5 client tests | No | Partial | One anonymous case not run | Not verified | PARTIAL | Public SEO path, auth expiry, API contract |
| Employer job create/edit/status | 2 server tests + dashboard components | Mocked only | Partial | No | Not verified | FAIL | Tenant isolation, validation, concurrency |
| Applications | 4 server + 5 client tests | Mocked | Partial | No | Not verified | FAIL | Status authority, tenant access, transactions |
| CV upload/profile image | 3 file-route tests | No | Tests accept anonymous path | No | Not verified | FAIL | Magic bytes, malware, ownership, persistence |
| CV/cover-letter AI | 3 route tests + service tests | No provider sandbox | Metered API partial | No | Not verified | PARTIAL | Public legacy routes, prompt injection, privacy, budgets |
| Billing/PayFast | 5 service tests | No sandbox | Route unit absent | No | Not verified | PARTIAL | Checkout/webhook/reconciliation/refund end-to-end |
| Advertising | Schema only | No | Event scaffold | No | Not verified | FAIL | Consent, render, viewability, revenue |
| Scraping normalization/compliance | 3 pytest-style functions | Not runnable | Ingest route 4 tests | No | No live scrape by design | PARTIAL | Python CI, source fixtures, orchestration auth |
| Duplicate job prevention | Unit ingest partial | No PostgreSQL race test | Partial | No | Not verified | PARTIAL | Concurrent transactions/unique-conflict behavior |
| Database migrations | Runner utilities only | SQLite executed | N/A | No | PostgreSQL not verified | FAIL | Clean PostgreSQL, upgrade snapshot, rollback/restore |
| Authorization/tenant isolation | A few role tests | No multi-tenant suite | Missing P0 negatives | No | Not verified | FAIL | Every privileged route and IDOR matrix |
| Production build/start/static serving | Build executed | Isolated startup executed | `/` and `/jobs` curl | No | N/A | FAIL | Frontend serving and dependency readiness |
| Backup/restore | No | No | N/A | No | Not verified | FAIL | Timed restore with integrity checks |
| Accessibility | No automated suite present | No | N/A | Script points to missing path | Not verified | FAIL | WCAG 2.2 AA |
| Performance/load | Script exists | Not verified | Not run against safe representative stack | No | Not verified | NOT VERIFIED | p95/p99, low-end Android, concurrency, capacity |

Release gates must be risk-based. Passing 156 configured unit/client tests does not compensate for failed identity, tenant, migration, startup, restore, or accessibility gates.

## 10. Security and privacy register

| Risk | ASVS/OWASP area | POPIA relevance | Status | Required evidence to close |
|---|---|---|---|---|
| Tracked Admin key | Secret management / cryptographic failures | Security safeguards; breach assessment | Confirmed P0 | Rotation, history purge, access review, incident decision |
| Role/UID self-assignment | Access control / mass assignment | Unauthorized processing | Confirmed P0 | Server-owned role identity tests |
| Profile/file IDOR | Object-level authorization | Confidentiality, data-subject rights | Confirmed P0 | Cross-user automated suite |
| Cross-employer access | Tenant isolation | Applicant PI disclosure | Confirmed P0 | Tenant-bound schema/query tests |
| Session secret logging | Sensitive data in logs | Safeguards/retention | Confirmed P0 | Redaction and secret canary tests |
| Public AI/scrape/SMS-adjacent endpoints | Abuse/cost/DoS | Purpose limitation and disclosure | Confirmed P1 | Auth, quotas, purpose/consent evidence |
| Upload type/storage weaknesses | Malicious file handling | CV/identity security | Confirmed P1 | AV/signature/private-storage evidence |
| Open CORS/missing headers | Security configuration | Safeguards | Confirmed P1 | Proxy-level dynamic tests |
| Dependency vulnerabilities | Vulnerable components | Safeguards | Confirmed P1/P2 | Patched SCA report and exceptions |
| No retention/deletion/export | Privacy engineering | Sections 14–24 rights/conditions | Confirmed P1 | End-to-end DSAR/retention tests |
| AI/provider cross-border processing | Third parties | Operators/transborder flows | Requires legal review | Signed DPAs, location/retention controls, notice/consent |
| Scraping source legality | Collection/provenance | Lawful processing, copyright/contract | Requires per-source legal review | Dated counsel/source approval artifacts |
| Advertising/cookie tracking | Consent/targeting | Electronic communications/direct marketing/POPIA | Absent | CMP logs, consent-mode and withdrawal tests |
| Incident response | Detection/response | Breach notification | Absent | Exercised runbook and contacts |

No destructive exploitation was performed. No statement in this report should be read as legal certification.

## 11. Commercial-readiness assessment

| Product | Readiness | Evidence | Blocking work |
|---|---|---|---|
| Sponsored listings | NOT READY | No sponsored-job data model/labeling/reporting; job integrity is weak | Product model, clear disclosure, pacing, billing, reporting |
| Direct employer campaigns | NOT READY | No tenant-safe campaign/creative/order system | Tenant isolation, IO/inventory, approvals, delivery reports |
| Programmatic display | NOT READY | Slot metadata only; no ad server/CMP/viewability | GAM/ad server, CMP, lazy loading, CLS/accessibility, revenue events |
| Native content | NOT READY | WiseUp ads exist, but governance/labeling/measurement incomplete | “Sponsored” treatment, editorial policy, consent and analytics |
| Newsletters | NOT READY | No subscription proof, ESP integration, suppression, inventory | POPIA/direct-marketing consent, unsubscribe, delivery analytics |
| Video | NOT READY | Content/ad video fields exist | Hosting, consent, player accessibility, viewability, bandwidth budgets |
| First-party audience data | NOT READY | No consent/segment governance | Purpose-limited taxonomy, consent ledger, minimization, retention |
| Campaign reporting | NOT READY | Ad events are not persisted | Impression/click/viewability ledger, fraud controls, reconciliation |
| ZAR revenue measurement | PARTIAL FOUNDATION | Subscription tables use integer cents/ZAR | Ad revenue ledger, invoices/tax/accounting, page/session RPM |
| Paid subscription | LIMITED FOUNDATION ONLY | PayFast signature/transactions/entitlements code | Sandbox E2E, reconciliation, refunds, alerts, legal terms |

The repository cannot currently support even defensible “basic programmatic display,” because consent-aware loading, valid measurement, and durable revenue records are absent. Higher-value products require a tenant-safe commercial data model and operations layer.

## 12. Remediation roadmap

### Immediate: before any production deployment

| Task | Severity | Dependencies | Complexity | Discipline | Acceptance criteria | Verification |
|---|---|---|---|---|---|---|
| Revoke/purge tracked Firebase key and investigate | P0 | Cloud/IAM access | M | Security/SRE | Old key unusable; history/artifacts clean; access reviewed | Secret scanner + IAM negative test |
| Remove secret logging and rotate session material | P0 | Log access inventory | S | Backend/Security | No secret value reaches stdout/file/error tracking | Startup canary test |
| Replace public user DTO and audit accounts | P0 | Identity decision | M | Identity/Data | Role/UID ignored for public callers; suspect admins reviewed | Registration negative tests |
| Protect profiles/files and migrate files private | P0 | Auth identity mapping/object storage | L | API/Security/Privacy | Token-derived owner; private signed download; legacy URLs revoked | Multi-user upload/read/delete suite |
| Implement employer/company/job ownership | P0 | Schema migration | L | API/Data | Every employer query/mutation tenant-filtered | Two-tenant integration suite |
| Serve frontend from canonical deployment | P1 | Hosting decision | M | Platform/Frontend | SPA and API served under production topology | Build/start/curl smoke |
| Replace migration baseline with PostgreSQL chain | P1 | Data backup/schema target | L | Data/SRE | Clean and upgrade migrations repeatably pass | Ephemeral PostgreSQL job |
| Make config/readiness fail closed | P1 | Feature inventory | M | Platform | Missing auth/database dependency = not ready/no traffic | Config matrix tests + readiness curl |
| Lock scraping/ingest and paid AI endpoints | P1 | Service identities/quotas | M | Security/API/AI | Anonymous denied; missing token disables ingest; quotas enforced | Abuse/negative tests |
| Eliminate plaintext/parallel password auth | P1 | Identity architecture | M | Identity | Single verified lifecycle; no plaintext database value | Auth integration suite |
| Enforce application state authority | P1 | Role/tenant model | M | API/Product | Candidates cannot set employer outcome | State-machine tests |
| Remove production mocks | P1 | Real APIs/error UX | M | Frontend/Product | No mock assets or fallback in production | Bundle scan + outage E2E |
| Add Express security baseline | P1 | Proxy/domain list | M | Security/API | Header, CORS, rate/body/time limits pass | Dynamic security tests |
| Patch/triage production dependencies | P1 | Lockfile unification | M | Platform/Security | Agreed SCA threshold and signed exceptions | `pnpm audit`/SCA CI |

### Stabilisation: first production milestone

| Task | Severity | Dependencies | Complexity | Discipline | Acceptance criteria | Verification |
|---|---|---|---|---|---|---|
| PostgreSQL backup/restore and object recovery | P1 | Hosting/storage | L | SRE/Data | RPO/RTO set and achieved in drill | Timed restore/integrity report |
| Central telemetry, health/readiness, SLO alerts | P1 | Monitoring platform | L | SRE | Availability/auth/jobs/uploads/AI/scrape alarms exercised | Game-day alert test |
| POPIA rights/retention/consent workflows | P1 | Data map/legal decisions | L | Privacy/Product | Access, correction, export, delete and retention pass | Synthetic DSAR suite |
| Canonical CI/CD and rollback | P1 | Hosting target | L | Platform | One pipeline deploys immutable artifact and rolls back | Staging promotion drill |
| Safe object uploads with AV/quarantine | P1 | Object storage/vendor | L | Security/Platform | Signature/size/AV/private access enforced | Malicious fixture suite |
| Consolidate routes/runtimes/lockfiles | P2 | P0/P1 fixes | L | Architecture | One router, package manager, ORM, deploy path | `pnpm run check` + dependency graph |
| Multi-tenant integration and critical E2E suite | P2 | Ownership/auth fixes | L | QA/API | Critical journey matrix green | CI report |
| Python packaging and scraper CI | P2 | Python version/tool | M | Data Platform | Locked install and pytest pass | `pytest` + SCA |
| Operational PayFast sandbox proof | P2 | Provider sandbox/legal terms | M | Payments/QA | Checkout, ITN, duplicate, failure, refund/reconcile pass | Sandbox E2E |

### Optimisation: after the platform is stable

| Task | Severity | Dependencies | Complexity | Discipline | Acceptance criteria | Verification |
|---|---|---|---|---|---|---|
| WCAG 2.2 AA remediation | P2 | Stable UI/design | L | Frontend/Accessibility | Automated and manual AA audit passes | axe + keyboard + screen reader |
| SEO/public job discovery | P2 | Public-content decision | L | Growth/Frontend | JobPosting JSON-LD, sitemap, canonicals, expiry/410 | Rich-results/crawler tests |
| Mobile performance budgets | P2 | Stable pages/CDN | M/L | Frontend/SRE | Defined LCP/INP/CLS and transfer budgets on low-end Android | Lighthouse/WebPageTest/RUM |
| Scalable SQL analytics/query tuning | P2 | Tenant schema/real load | M | Backend/Data | No full-table app filtering; capacity targets met | Query plans/load tests |
| Advertising platform and consent | P2 | Legal/CMP/ad server | L | Ad Ops/Privacy/Data | Consent-aware render, viewability, RPM, reconciliation | Browser + reporting reconciliation |
| Documentation/repository cleanup | P2/P3 | Canonical architecture | M | Architecture/Docs | Current runbooks only; history archived | Clean-clone operator exercise |

Estimates are relative: S = days, M = roughly one to three sprints, L = multi-sprint/cross-team. They are not commercial commitments.

## 13. Production launch checklist

| Gate | Status | Evidence / required action |
|---|---|---|
| Clean pnpm installation | PASS | Frozen CI-mode install passes |
| One package manager/lockfile | FAIL | Root sanity check rejects npm lock |
| Environment validation | FAIL | Validators false-pass missing real startup dependencies |
| Production build | PASS | Vite + esbuild succeed |
| Production frontend serving | FAIL | `/jobs` returns JSON 404 |
| Production startup | FAIL | Starts degraded with Firebase/WiseUp/cache failures |
| Type checking | PASS | Root `tsc --noEmit` succeeds |
| Lint/format gate | NOT VERIFIED | Lint timed out; format check not run due scope/time |
| Unit tests | PASS | 53 server + 103 client |
| Integration tests | FAIL | Script aliases unit directory |
| Browser E2E | FAIL | Browser missing; only two anonymous cases exist |
| Accessibility tests | FAIL | No accessibility specs/gate |
| PostgreSQL migrations | FAIL | SQLite syntax in canonical chain |
| Migration rollback/upgrade | NOT VERIFIED | No production snapshot test |
| Registration/login lifecycle | FAIL | Role mass assignment and parallel auth |
| Server authorization | FAIL | IDOR and tenant isolation defects |
| Upload security | FAIL | Public local disk, MIME-only, no AV |
| Durable uploads | FAIL | No object store/multi-replica proof |
| Database backup | FAIL | Checklist explicitly open |
| Restore drill | FAIL | No evidence |
| Monitoring/metrics/traces | FAIL | Scaffolds unmounted |
| Alerts/on-call | FAIL | No evidence |
| Public health/readiness | FAIL | No active endpoints |
| Security headers | FAIL | Canonical Express lacks Helmet/CSP |
| CORS | FAIL | Wildcard |
| Rate limiting | PARTIAL | In-memory `/api/v1` only |
| Dependency/SCA gate | FAIL | Both audits fail; graphs conflict |
| Secret scan/rotation | FAIL | Live key tracked |
| POPIA privacy notice | PARTIAL | Copy exists; unsupported compliance claim |
| POPIA rights/retention | FAIL | No operational workflows |
| Cookie/analytics/ad consent | FAIL | No CMP/ledger |
| AI privacy/cost controls | FAIL | Public legacy endpoints |
| Scraper governance | PARTIAL | Registry/robots good; public controls/fail-open ingest |
| Analytics integrity | FAIL | Mock data/user-mutable outcomes |
| Ad delivery/reporting | FAIL | Scaffold only |
| PayFast production readiness | NOT VERIFIED | Unit foundation only |
| Rollback | FAIL | No canonical automated procedure |
| Incident response | FAIL | No exercised runbook |
| Legal review | NOT VERIFIED | Required for POPIA, scraping, marketing, payments, ads |

## 14. Definition of 100% production ready

T-Square may reasonably be called fully production-ready only when all of the following are evidenced, not merely documented:

1. Every P0 and P1 in this report is closed with automated regression tests and an accountable owner.
2. The exposed credential is revoked, Git/artifact history is clean, an incident assessment is complete, and continuous secret scanning blocks recurrence.
3. One canonical runtime, package manager, ORM/schema, database, upload store, API contract, and deployment path remain.
4. A clean checkout installs, lints, type-checks, tests, builds, migrates an empty PostgreSQL database, upgrades a representative snapshot, starts, reports ready, serves all SPA routes, and passes smoke tests.
5. Authentication lifecycle and tenant/object authorization are proven across anonymous, candidate, employer A, employer B, moderator/admin, disabled, expired, and revoked identities.
6. Personal files are private, durable, malware-screened, access-logged, retained/deleted by policy, and recoverable.
7. Database and object backups are encrypted, monitored, and restored successfully within approved RPO/RTO; rollback is rehearsed.
8. Observability answers availability, sign-in, job, application, upload, database, scraping, duplicate, AI-cost, ad-render, revenue, and deployment-regression questions, with exercised alerts.
9. Production mocks and unsafe fallbacks are absent; disabled features fail closed and honestly.
10. Dependencies meet an approved vulnerability/license policy with documented exploitability exceptions and automated SCA.
11. Critical business journeys pass unit, integration, API, browser, security, and failure-path gates against production-equivalent infrastructure.
12. WCAG 2.2 AA, low-end Android/mobile-network performance, browser compatibility, and Core Web Vitals targets are independently verified.
13. Public job pages are crawlable, canonical, structured with valid JobPosting data, included in sitemaps, and correctly expire.
14. POPIA technical/operational controls—data mapping, lawful basis, consent, minimization, data-subject rights, retention, deletion, operators, cross-border flows, breach response—are implemented and reviewed by qualified South African counsel.
15. Every scraping source has current, attributable robots/terms/copyright/privacy approval, expiry/re-review, traceability, and kill controls.
16. Paid AI, SMS, PayFast, analytics, and advertising have provider contracts, consent behavior, budget/fraud controls, reconciliation, and sandbox/staging evidence.
17. Advertising claims are supported by durable impressions, viewability, click, fill, RPM, pacing, device/geography, and ZAR revenue reporting without harming accessibility, Core Web Vitals, or job-search trust.
18. Operations have current runbooks, named ownership/on-call, change approval, rollback, incident communications, breach handling, capacity plans, and successful game-day evidence.
19. Every launch-checklist row above is **PASS**, with time-bounded evidence from the release candidate and target production topology.

Until those conditions are satisfied, “100% production ready” would not be defensible.

## 15. Gated production-readiness execution programme

This section incorporates the supplied execution roadmap and adapts it to the audited T-Square repository. It does not override the evidence or severity ratings above. A gate remains **NOT VERIFIED** until its acceptance evidence exists, and a code change alone does not close a finding.

### 15.1 Programme principles and governance

1. **Prove before promoting.** Compilation or implementation is not production evidence.
2. **Blockers before polish.** P0 and launch-blocking P1 findings take precedence over visual, SEO, advertising, and revenue optimisation.
3. **One production architecture.** Development, CI, staging, deployment, documentation, and operations must agree on the canonical runtime.
4. **Every phase ends with a gate.** Evidence must include the implementation reference, verification command or reproducible procedure, expected and actual result, reviewer, and release record.
5. **Fail closed.** Unconfigured identity, ingestion, AI, storage, consent, or security controls must disable the affected capability rather than expose a fallback.

| Role | Accountable scope |
|---|---|
| Technical Lead | Architecture, sequencing, risk acceptance, go/no-go |
| Backend/API | Identity, authorization, validation, data, provider integrations |
| Frontend | Critical journeys, error truthfulness, accessibility, mobile performance, SEO |
| DevOps/SRE | Environments, CI/CD, secrets, telemetry, backup/restore, rollback |
| Security Owner | Threat review, credential response, access control, upload security |
| QA Owner | Test matrix, negative tests, regression and release gates |
| Data/Ingestion Owner | Source governance, provenance, normalization, deduplication |
| Product Owner | Launch scope and critical-journey acceptance |
| Privacy/Information Officer | POPIA processing register, rights, retention, consent, breach process |
| South African legal reviewer | Privacy, scraping, contracts, copyright, marketing, advertising |
| Commercial Owner | Advertising, sponsored products, campaign operations, ZAR reporting |

One person may hold multiple roles, but each row needs a named human before launch. Independent closure by someone other than the implementer is required where practical.

### 15.2 Phase gates

| Phase | Objective and principal work | Required deliverables | Exit gate |
|---|---|---|---|
| 0 — Baseline | Freeze commit/toolchain evidence; audit canonical frontend, backend, data, auth, uploads, deploy, tests, security, privacy, scraping, observability, and ads | This report, architecture/runtime maps, registers, test matrix, initial score | **PASS for repository baseline.** Owners and launch-critical journeys still require team confirmation |
| 1 — Canonical runtime | Declare one frontend/backend/database/auth/storage/build/start/deploy path; classify or disable parallel runtimes; standardize package manager and versions; remove unsafe fallbacks; reconcile docs | ADRs, ownership table, clean-install contract, legacy deploy protections | One unambiguous runtime and lock path; clean install; no accidental mocks/deployments; docs match execution |
| 2 — Security and data | Rotate/purge secrets; validate config; complete identity lifecycle; enforce route/resource/tenant authorization; secure APIs/uploads; prove PostgreSQL integrity; govern AI and POPIA controls | Access matrix, security register, private upload design, migration evidence, privacy/retention/AI inventories | No P0; no auth bypass; private CVs; fail-closed config; PostgreSQL and persistent-data scope proven |
| 3 — Delivery platform | CI gates, immutable production artifact, separated environments, controlled migrations, TLS/probes/shutdown/rollout, backups and real restore | CI/CD, staging, migration/backup/restore/rollback runbooks and evidence | Clean commit deploys reproducibly; staging mirrors production; restore and rollback have succeeded |
| 4 — Critical journeys | Align UI/API contracts; remove mocks/broken routes; candidate/employer/platform tests; WCAG 2.2 AA; low-end mobile; crawlable public jobs | Journey matrix, unit/integration/API/E2E evidence, accessibility/mobile/SEO reports | Every launch journey protected; negative permissions pass; no production mocks; accessibility and indexability gates pass |
| 5 — Operability | Sanitized correlated logs, error tracking, metrics/dashboards, SLO alerts, incident runbooks and operational drills | Dashboard/alert catalogue, logging policy, on-call record, runbooks, game-day evidence | Team can detect login/browse/apply/upload/publish failure; alerts reach an owner; rollback, restore, and breach escalation exercised |
| 6 — Scraping governance | Default-deny source approval; enforce registry; minimize PI; normalize/provenance/expiry; idempotency/quarantine; removals and legal review | Source register, enforced approvals, quality dashboard, duplicate/removal tests, legal record | Only approved sources run; retries are idempotent; provenance/removal work; legal approval and observability exist |
| 7 — Commercial readiness | Consent-aware analytics/ads; labelled responsive placements; integrity of organic versus paid jobs; ZAR revenue and campaign operations; CWV budgets | Consent/ad implementation, placement inventory, labels, revenue dashboard, rate card, campaign runbook | Consent respected; ads do not obstruct journeys; delivery and ZAR revenue reconcile; rapid ad kill switch works |
| 8 — Staging and limited production | Production-like staging; complete release rehearsal; load/resilience and security validation; controlled cohort | Rehearsal/load/security reports, launch scope/dashboard, rollback checkpoint, go/no-go record | Deployment/E2E/alerts/backup/restore/rollback succeed; no P0 or critical-path P1 |
| 9 — Full certification | Re-evaluate every release gate and accepted residual risk | Signed production decision and handover | No P0/P1 launch blockers, all critical gates pass, P2 exceptions have owners/dates, no scoring cap |

### 15.2.1 Phase 0 — baseline execution feedback

**Status:** PARTIAL — the repository baseline is complete; formal owner/journey acknowledgement is pending.

**Done:** Sections 1–14 record the canonical runtime, evidence, score, registers, launch checklist, and initial NO-GO decision. **Next gate:** store named owner and launch-journey confirmation in the release record.

### 15.2.2 Phase 1 — canonical runtime execution feedback

**Status:** PARTIAL.

**Done:** `pnpm run check` and `pnpm run build` pass; the built server serves `/` and `/jobs` as SPA HTML, preserves API 404s, applies Helmet, bounds request bodies, and uses credentials-aware CORS. A base-users migration now satisfies the first foreign-key dependency before the files migration. **Open:** legacy deployments, remaining mocks, ignored overrides, parallel runtimes, and one typed configuration contract. **Next gate:** clean-clone canonical deployment verification.

### 15.2.3 Phase 2 — security and data execution feedback

**Status:** PARTIAL — local controls started; P0 closure is not claimed.

**Done:** Server-owned registration and Firebase first-login provisioning, restricted legacy profile updates (role/Firebase identity/password fields excluded), authenticated owner-bound profile/file routes, signature-checked uploads with safe MIME-derived extensions, legacy public `/uploads` URL fallback removal, temporary-upload cleanup on route errors, candidate-protected application status transitions, fail-closed ingest, authenticated/rate-limited legacy AI, admin-only scraper controls, startup secret-log removal, PostgreSQL migration normalization, and the first owner-scoped employer job/application paths are implemented and tested. **Open:** provider revocation/history purge, legacy-job ownership backfill, complete tenant coverage, durable private object storage, malware scanning, retention/DSAR/consent, and AI governance. **Next gate:** no P0 or authorization bypass with independent evidence.

### 15.2.4 Phase 3 — delivery platform execution feedback

**Status:** PARTIAL — migration execution is locally reproducible; deployment and recovery controls are not certified.

**Done:** Local production build/start smoke; clean PostgreSQL 16 migration applies all 13 migrations, fresh SQLite migration also applies all 13, and a production startup dependency gate now blocks traffic admission when Firebase is unavailable. **Open:** CI/staging, environment separation, backup/restore, TLS, rollout, and rollback. **Next gate:** clean commit deploys to production-like staging and survives restore/rollback rehearsal.

### 15.2.5 Phase 4 — critical journeys execution feedback

**Status:** PARTIAL — regression foundation exists; journeys are not certified.

**Done:** Server 22 files/85 tests and client 16 files/103 tests pass; the production build completes for client and server; `/cv-builder` is auth-gated; employer job/application-list and dashboard-metric isolation, database-backed ownership and role middleware allow/deny/error cases, cross-employer job-status/application-read denials, candidate status-mutation denial, route-level restricted legacy profile updates, file download/delete IDOR denials, spoofed PDF rejection, temporary-upload cleanup, final-file cleanup after metadata failure, explicit opt-in-only public job/company mock fallback behavior, API-backed Companies and Company Profile pages, and visible API error handling are covered. **Open:** full two-tenant negative matrix, browser E2E, accessibility, mobile, SEO, duplicate submissions, legacy page fixture imports outside the updated journeys, AI fallback governance, and production bundle fixture exclusion. **Next gate:** all critical candidate/employer/platform flows pass positive and negative tests.

### 15.2.6 Phase 5 — operability execution feedback

**Status:** PARTIAL.

**Done:** `/health` returns 200; `/ready` returns 503 when Firebase is unavailable, proving dependency-aware admission. **Open:** central telemetry, dashboards, alerts, on-call, restore/rollback drills, and breach runbooks. **Next gate:** exercised alerts reach named responders.

### 15.2.7 Phase 6 — scraping governance execution feedback

**Status:** PARTIAL.

**Done:** Scraper control routes require an authenticated admin, ingest fails closed, and cancellation now sends `SIGTERM` to the tracked child process and preserves the cancelled terminal state; registry, robots, throttling, redaction, normalization, and dedupe evidence remain recorded. **Open:** durable queue/state, forced-kill escalation, default-deny approvals, reviewer/expiry/legal evidence, retention, and takedown. **Next gate:** no unapproved source can run or ingest and cancellation is exercised in staging.

### 15.2.8 Phase 7 — commercial readiness execution feedback

**Status:** NOT STARTED.

**Done:** Commercial gaps and disable-by-default launch scope are documented. **Open:** consent ledger, labelled placements, durable event/revenue measurement, campaign operations, reconciliation, and ad kill switch. **Next gate:** consent-aware delivery and ZAR revenue reconciliation pass.

### 15.2.9 Phase 8 — staging certification execution feedback

**Status:** NOT STARTED.

**Done:** Rehearsal sequence and hard-stop criteria are defined. **Open:** production-like staging, migration/deploy/smoke/alert/rollback sequence, load, security validation, and signed cohort scope. **Next gate:** full rehearsal passes with no P0 or critical-path P1.

### 15.2.10 Phase 9 — production certification execution feedback

**Status:** NOT STARTED.

**Done:** Certification criteria and decision participants are defined. **Open:** unresolved P0/P1, PostgreSQL/restore, operational, privacy/legal, scraping, accessibility, SEO, commercial, and deployment gates. **Next gate:** every applicable launch checklist row is PASS or legally approved and scoring caps are removed.

### 15.2.11 Feedback update rule

After every phase action, update its block with the UTC date, status (`PASS`, `PARTIAL`, `NOT STARTED`, or `BLOCKED`), completed work, evidence paths/commands, actual result, unresolved blockers, accountable owner, and next gate. A phase must never be marked complete from code changes alone.

### 15.3 Workstream details retained from the roadmap

- **Authentication:** registration, login, verification, reset/passwordless/social flows, disabled/deleted users, token expiry/revocation, logout and restoration must form one tested lifecycle. Identity-provider proof is identity, not authorization.
- **Authorization:** maintain a route matrix covering anonymous, candidate, employer A, employer B, administrator and service identities; enforce role, ownership, company relationship, admin policy, and field-level mutation on the server.
- **API protection:** typed request/response contracts, safe errors, distributed rate and body limits, CORS allowlist, proxy/timeouts, parameterized access, safe redirects, and quotas for cost-bearing endpoints.
- **Uploads:** signature/MIME/extension/size validation, generated keys, quarantine/malware scanning, private/durable object storage, signed access, public/private separation, audit, retention, deletion, backup and restore.
- **Database:** PostgreSQL-only migration proof, constraints/indexes/cascades, transactions, fixed-precision or integer-cent ZAR, UTC storage with South African display semantics, stale-job and deletion rules.
- **AI:** minimize/redact PI, document provider/cross-border processing, quota and payload ceilings, isolate untrusted prompt content, validate output, use explicit outage states, prevent sensitive logs, and monitor spend in ZAR.
- **POPIA:** processing purposes/lawful bases, versioned consent, correction/access/export/deletion, retention and purge, direct-marketing suppression, cookies/analytics/ads, operator and cross-border records, DSAR contacts, breach procedure, and qualified legal review.
- **CI/CD:** sanity/version/secret/lint/type/unit/integration/API/migration/build/SCA/security/E2E gates; immutable artifacts; separated credentials/data; controlled migrations; readiness; graceful shutdown; post-deploy smoke and rollback.
- **Critical journeys:** candidate identity/profile/CV/search/detail/apply/status/privacy; employer identity/company/verification/job CRUD/publish/expiry/applicants/dashboard; platform indexing/ingestion/deduplication/expiry/provider and dependency failure/admin access.
- **Accessibility/mobile/SEO:** WCAG 2.2 AA, keyboard/focus/errors/contrast/screen readers/reduced motion; narrow affordable Android devices, constrained CPU/network/memory; stable public job URLs, canonicals, sitemap/robots, JobPosting data, expiry/410 and social metadata.
- **Observability:** release-correlated logs/errors/traces; platform, product, ingestion, AI-cost and commercial metrics; alerts for availability, auth/application failures, database/storage, ingestion abuse/duplicates, AI cost, migration, backup and ad delivery.
- **Scraping:** named source owner, dated terms/robots/copyright/POPIA review, allowed fields, rates/concurrency, attribution, expiry and approval; default deny; audited idempotency, provenance, removal and suspension.
- **Advertising:** consent-aware loading, named responsive placements, clear Sponsored/Advertisement labels, viewability/fill/RPM/revenue by placement/device/geography in ZAR, pacing/frequency/creative/reconciliation, privacy and CWV guardrails.

### 15.4 Thirty-two-hour launch control plan

The full nine-phase programme cannot be responsibly completed in 32 hours. The only defensible target is a **security-gated limited launch** with dangerous and unverified capabilities disabled. Public launch remains **NO-GO** unless every hard gate below is proven.

| Window | Focus | Required output | Hard stop condition |
|---|---|---|---|
| Hours 0–4 | Containment and ownership | Revoke exposed Firebase key; remove tracked copy and secret logging; assign named technical/security/SRE/product/privacy owners; freeze launch scope | Credential cannot be revoked, repository/history remains distributable, or no accountable incident owner |
| Hours 4–10 | Identity and exposed data | Server-owned registration role/UID; eliminate plaintext path; protect/disable profile and file routes; deny cross-tenant employer access; regression tests | Any known anonymous/other-user CV/profile access or role escalation remains |
| Hours 10–16 | Runtime and data | Serve one SPA/API artifact; fail-closed config/readiness; PostgreSQL migration baseline on clean DB; disable SQLite production fallback and unsafe mocks | Clean PostgreSQL migration, startup readiness, or frontend serving fails |
| Hours 16–22 | Delivery and recovery | Canonical staging deploy; private durable upload decision/implementation; backup plus isolated restore; rollback; security headers/CORS/limits | No successful restore/rollback, or personal files remain public/local-only |
| Hours 22–27 | Critical-path proof | Candidate/employer two-tenant API tests; focused browser flows; secret/SCA checks; provider failure behavior; low-end mobile/accessibility smoke | Any P0 or critical-path P1 test fails |
| Hours 27–30 | Operability and compliance scope | Health/readiness, centralized error/metric visibility, actionable alerts, incident/breach runbook; disable unapproved scraping, AI, payments, analytics and ads | Team cannot detect/respond, legal/privacy owner rejects scope, or unsafe features cannot be killed |
| Hours 30–32 | Release rehearsal and go/no-go | Deploy immutable release candidate, migrate, smoke, synthetic application, alert test, rollback checkpoint, signed decision | Any hard gate lacks evidence; no rollback; launch checklist contains a critical FAIL |

**Default limited-launch feature flags:** scraping disabled except separately approved sources and service identity; legacy AI disabled; payments/SMS disabled; advertising and non-essential analytics disabled; employer onboarding invite-only; synthetic or tightly controlled data until file privacy, tenant isolation, restore, and POPIA gates pass.

### 15.5 Live execution register

| Item | Audit ID | Status at execution start | Local action | External dependency | Closure evidence |
|---|---|---|---|---|---|
| Baseline report and score | Programme 0 | PASS | Report completed at audited commit | Team accepts journeys/owners | This document |
| Exposed Firebase Admin key | P0-01 | IN PROGRESS | Remove tracked active copy; add repository guard | Provider IAM access, history purge, incident review | Old key rejected; full-history/artifact scan clean |
| Session-secret logging | P0-02 | PARTIAL | Remove value logging; add regression/static check | Rotate deployed secret and review logs | Canary absent from startup/log sinks |
| Registration role/UID escalation | P0-03 | IN PROGRESS | Public DTO excludes server-owned fields; reject unexpected input; hash or remove password path; tests | Audit existing privileged accounts | Negative API tests and account review |
| Profile/file IDOR | P0-04 | PARTIAL | Authenticate and ownership-bind current profile/file routes; keep download private | Private object storage and legacy file migration | Cross-user/anonymous tests; private storage |
| Employer tenant isolation | P0-05 | PARTIAL | Add nullable job owner, scope employer dashboards/lists/applications, enforce owner checks on job CRUD/status and application reads/status updates | Legacy-job ownership backfill, company/onboarding policy, complete two-tenant matrix | Two-tenant CRUD suite |
| Ingest fail-open | P1-05 | IN PROGRESS | Require configured service token and fail closed; tests | Rotate/provision deployment token | Missing/invalid token rejected |
| Remaining P1 gates | P1-01–15 | NOT STARTED/PARTIAL | Follow hours 10–30 sequence above | Hosting, database, cloud, provider, legal and human ownership | Launch checklist rows become PASS |

### 15.6 Go/no-go rule for the 32-hour deadline

At hour 30, recalculate the score and review the report’s launch checklist. A limited launch is **NO-GO** if any of the following remains:

- an exposed credential has not been revoked and incident-reviewed;
- any known role escalation, IDOR, cross-tenant read/write, plaintext password, or public personal-file path remains;
- the production artifact cannot serve the UI and API or cannot report dependency-aware readiness;
- a clean PostgreSQL migration and representative restore have not passed;
- rollback and critical alerts have not been exercised;
- production mocks can represent fabricated jobs, employers, applications, payments, or analytics as real;
- unapproved scraping, public paid AI, SMS, payments, analytics, or advertising cannot be disabled;
- or the technical, security, SRE, product and privacy owners do not sign the scope and evidence.

Deadline pressure does not convert a failed gate into accepted evidence. If a hard gate misses the deadline, the safe deliverable is a delayed launch with a tested recovery plan—not an exposed production system.

### 15.7 Current execution evidence — 2026-07-23 UTC

The remediation cycle is being executed in small reviewed batches. Tenant isolation is committed; the upload-validation batch below is provisional until its final verification and commit are recorded.

| Check | Result | Evidence and interpretation |
|---|---|---|
| Public registration hardening | PASS | `server/tests/unit/publicUserRegistrationSchema.test.ts`: 5/5; public schema rejects `role`, `firebaseUid`, and `referredByUserId`; server sets role and Firebase mapping |
| Ingest fail-closed | PASS | `server/tests/unit/jobIngestRoutes.test.ts`: 6/6; missing and invalid token paths do not call ingestion |
| Authenticated profile/file route tests | PASS | Server unit suite now reflects owner-derived identity and passes; anonymous/public access is no longer encoded as expected behavior |
| Legacy AI route exposure | PARTIAL | `server/routes/cvApi.ts` legacy provider routes now require Firebase auth and the AI rate limiter; output governance, provider privacy, quotas, and fallback removal remain open |
| Scraper control exposure | PARTIAL | `server/routes/scraping.ts` requires an authenticated database user with `admin` role; durable queue, child-process cancellation, distributed state, and source governance remain open |
| Secret logging | PARTIAL | Startup value logging was removed; deployed-secret rotation, log-history review, and full-history purge remain external actions |
| Tracked credential | PARTIAL | The active service-account JSON was removed from the worktree and ignored going forward; provider revocation, access review, and Git/artifact history purge are not locally verifiable |
| Frontend/API production serving | PASS for isolated smoke | `pnpm run build` passed; isolated built server returned HTML 200 for `/` and `/jobs`, JSON 404 for `/api/missing`, and Helmet headers; dependency readiness is still not a real production gate |
| Production security baseline | PARTIAL | Helmet, bounded JSON/urlencoded bodies, credentials-aware CORS, auth-gated `/cv-builder`, and explicit `/health`/`/ready` probes are active; distributed rate limiting, trusted proxy policy, and CSP review remain |
| Type/build/tests | PASS | `pnpm run type-check`; `pnpm run build:server`; server 22 files/85 tests; client 16 files/103 tests |
| Repository sanity | PASS | `pnpm run check` passes after removal of the conflicting root `package-lock.json`; pnpm still warns that the legacy `pnpm.overrides` field is ignored |
| PostgreSQL migration/restore/operations | PARTIAL | Pass G fresh PostgreSQL 16 container applied all 13 migrations, including `0012_add_job_owner.sql`; fresh SQLite has also applied all 13; `pnpm run check` passes; `/health` returns 200 and production readiness now blocks unavailable Firebase; backup/restore, alert exercise, rollback drill, and browser E2E remain unverified |
| Employer tenant isolation | PARTIAL | `created_by_user_id` owner column/index and employer scoping are implemented; `employerRoutes.test.ts` now proves employer job/application-list and dashboard-metric isolation, while `jobApplicationsRoutes.test.ts` covers cross-employer denials; legacy jobs with null owners, company onboarding policy, and complete CRUD/integration coverage remain open |
| Upload content validation | PARTIAL | `server/routes/files.ts` now checks image/PDF magic bytes, derives storage extensions from MIME, cleans Multer temp files on router errors, removes final files when metadata persistence fails, and rejects cross-user download/delete; `fileService.ts` no longer emits public `/uploads` URLs; `fileRoutes.test.ts` covers valid PNG, spoofed PDF rejection, cleanup, and IDOR denials; durable object storage, AV/quarantine, and restore remain open |
| Application state authority | PARTIAL | `jobApplicationsRoutes.test.ts` now proves candidate status mutation returns 403; employer/admin transition and tenant coverage remain limited to mocked route tests |
| Legacy profile update authority | PARTIAL | `/api/v1/users/:userId` now accepts only strict profile fields and rejects role/Firebase identity/password mutation; `v1ProfileUpdateRoutes.test.ts` covers rejection and editable-field forwarding; full authenticated integration remains open |
| Legacy ownership middleware | PARTIAL | `authorizeOwnership` now resolves the authoritative database user from Firebase UID, rejects invalid IDs, and no longer trusts a caller-shaped numeric claim; `ownershipMiddleware.test.ts` covers owner allow, cross-user deny, and malformed-ID rejection; full authenticated integration remains open |
| Database-backed role authorization | PARTIAL | `authorize` now resolves the database user before evaluating required roles; `roleAuthorizationMiddleware.test.ts` proves Firebase admin claims cannot override a database user role, database admins are allowed, and identity failures reach error handling |
| Firebase first-login role provisioning | PASS locally | `authenticatedUser.test.ts`: 5/5; a new Firebase identity is always created with database role `user`, even when the presented claim says `admin`; existing database identities remain authoritative |
| Public job-preview mock fallback | PARTIAL | `client/src/services/tieredJobsService.ts` now requires `VITE_USE_MOCK_PUBLIC_DATA=true` plus development mode for fixture responses; production/non-mock API failures throw an error instead of returning fabricated jobs; client 16 files/103 tests and production build pass |
| Public company mock fallback | PARTIAL | `client/src/services/companyService.ts`, `CompaniesSection.tsx`, and `CategoriesSection.tsx` now require explicit development mock mode; production API failures surface errors rather than synthetic companies/jobs/alerts or fabricated company AI copy; client 16 files/103 tests (clean rerun) and production build pass |
| Companies page production journey | PARTIAL | Commit `7992c6c`: `client/src/pages/Companies.tsx` fetches `/api/companies`, validates the response shape, and surfaces failures; fixture query path removed; type-check/build evidence recorded below |
| Company profile production journey | PARTIAL | Commit `4f970bb`: `client/src/pages/CompanyProfile.tsx` resolves company and active jobs through `/api/companies/:slug` and `/api/jobs/company/:id`; fixture imports removed from the rendered journey |
| Scraper cancellation | PARTIAL | Commit `81be2f5`: active child processes are tracked, cancellation sends `SIGTERM`, and close/error handlers retain `cancelled` instead of overwriting it with `failed`; staging process-tree verification remains open |
| Company AI failure behavior | PARTIAL | Commit `6b30f2d`: `generateCompanySummary` and `generateCoverLetter` now propagate provider/API failures instead of returning fabricated summaries or letters; provider entitlement, privacy, and quota controls remain open |
| FAQ mock fallback | PARTIAL | Commit `4027408`: FAQ fixtures require explicit development mock mode; production and non-mock development paths call `/api/faqs`, and failures are propagated instead of returning canned answers |
| FAQ API regression coverage | PASS locally | Commit `f93d871`; `faqService.test.ts` covers API success, general failure propagation, and category failure propagation (3/3) |
| Companies API error journey | PASS locally | Commit `1497802`: the page renders `data-testid="companies-error"` with a user-visible unavailable state; no fixture fallback is used; client 16 files/103 tests and type-check/build pass |
| Company profile API error journey | PASS locally | Commit `e9db1ce`: the page renders `data-testid="company-profile-error"` for query failures instead of presenting a not-found state; client 16 files/103 tests and type-check/build pass |
| Company jobs API error journey | PASS locally | Commit `be52d8d`; the Jobs tab renders `data-testid="company-jobs-error"` when the jobs query fails instead of silently showing an empty list |
| Scraper cancellation regression | PASS locally | Commit `036d43c`; `scrapingProcessControl.test.ts` covers active SIGTERM, already-dead process, and missing process (3/3); process-tree staging verification remains open |
| Scraper cancellation escalation | PARTIAL | Commit `ef39126`: cancellation schedules a 5-second bounded SIGKILL if the child has not exited; timers are cleared on close/error; process-tree staging verification remains open |
| Scraper kill-escalation regression | PASS locally | Commit `abdce0c`; `scrapingProcessControl.test.ts` now covers active SIGTERM, dead-process no-op, missing process, and force-kill exit-state decision (4/4) |
| Browser smoke / E2E | BLOCKED | Playwright skill prerequisite `npx` is available, but the container lacks required browser shared libraries (`libnspr4.so`, `libnss3.so`, GTK/GBM libraries); Chromium was downloaded but cannot launch; browser E2E remains unverified rather than marked PASS |
| Production startup dependency gate | PARTIAL | `assertProductionDependenciesReady` and `startupReadiness.test.ts` block production startup when Firebase is unavailable while allowing isolated test mode; `assertProductionDatabaseConnection` rejects SQLite in production; live deployment admission, database connectivity, and orchestration probes remain unverified |
| Client/build release verification | PASS locally | `pnpm run test:client`: 16 files/103 tests; `pnpm run build`: Vite client and esbuild server completed; browser E2E, accessibility, and production topology remain unverified |
| Production runtime validator | PASS for negative contract | `DATABASE_URL=sqlite:./test.db node scripts/validate-primary-runtime.js` exits non-zero and reports missing Firebase configuration plus SQLite prohibition; `pnpm run check` passes; valid production secrets and deployment orchestration remain unverified |
| Marketing/job mock guard coverage | PASS locally | Commits `42c374e`, `ca97b1d`, and `421fb00`; marketing rules and job-service fixture paths require explicit development mock mode, including the resolver-selected `client/src/services/jobService.js`; `productionMockGuards.test.ts` passes 3/3, full client suite passes 20 files/116 tests, and type-check passes |
| Legacy Firebase profile/file surface | PARTIAL | Commit `768389c`; `functions/index.js` now verifies Firebase bearer tokens, restricts profile access to the caller/admin, rejects unauthenticated callable image/CV processing, and returns 501 instead of success-shaped TODO responses; `node --check functions/index.js` and `pnpm --dir functions run build` pass; canonical storage migration and deployed-function retirement remain open |
| Startup session-secret logging | PARTIAL | Commit `077c697`; `startupSecretLogging.test.ts` passes 1/1 and asserts the startup module does not log or directly expose `SESSION_SECRET`; deployed-secret rotation and historical log review remain external actions |
| Employer tenant boundary regression | PARTIAL | Commit `0fd0e7e`; `employerRoutes.test.ts` now proves employer job lists and dashboard metrics exclude another employer's jobs and legacy jobs with null ownership; targeted suite 6/6 and type-check pass; full CRUD/integration evidence and ownership backfill remain open |
| Employer CRUD/application tenant isolation | PARTIAL | Commits `7c33634`, `58fe770`, `b1b907d`, `6c7e076`, `06b4ec2`, and `8e5fb18`; employer detail reads/edits/status changes and application reads/listings/status/withdrawal mutations reject cross-tenant or unowned-job access; unknown non-admin roles now fail closed; employer suite 9/9, application suite 12/12, and type-check pass; full integration coverage and ownership backfill remain open |
| Tracked-secret release gate | BLOCKED/P0 | Commit `897022d`; `pnpm run security:tracked-secrets` reports only `.env.production` private-key and credentialed database URL patterns, without printing values; rotation and history purge are required before this gate can pass |
| Legacy Firebase security regression | PASS locally | Commit `f8b62a6`; `legacyFirebaseSurface.test.ts` passes 2/2 and `node --check functions/index.js` passes, covering authenticated profile/file TODO handlers and callable ownership checks |
| SquareJUMP route security contract | PASS locally | Commit `d679951`; `squareJumpRouteSecurity.test.ts` passes 11/11, proving authentication on user/event routes and authentication plus authorization on admin policy/review routes |
| SquareJUMP metrics/link operations | PARTIAL | Commit `9774a82`; authenticated events now aggregate daily metrics, rescoring consumes recent engagement/application metrics, and the link-verification worker updates release schedules; `pnpm run type-check` passes; migration rehearsal, worker scheduling, and external URL verification remain open |
| SquareJUMP migration/worker safety | PARTIAL | Commits `b92e4c9` and `d4efffb`; metrics migration suite passes 4/4, worker safety suite passes 2/2, and type-check passes; live PostgreSQL rehearsal and scheduled-worker evidence remain open |
| Secret-gate output safety | PASS locally / P0 remains open | Commit `1321773`; gate-output suite passes 1/1 and confirms findings contain paths/pattern names only; credential rotation and history purge remain required |
| Migration tooling isolation | PASS locally | Commit `96d34fd`; Drizzle generation now writes review output to ignored `.drizzle-generated/`, `db:status` reads applied/pending migrations through a bounded CLI, and type-check passes |
| SquareJUMP event/notification/link safeguards | PARTIAL | Commits `70beb83`, `1eb0e85`, and `f81ad21`; event binding suite 1/1, worker safety suite 4/4, and type-check pass; live event ingestion, scheduled worker execution, and external link verification remain open |
| Upload volume and bundle delivery | PARTIAL | Commit `ee31d68`; upload paths share `UPLOAD_DIR`, startup validates writable subdirectories, image uploads are bounded/normalized when decodable, private downloads receive immutable cache headers, and bundle analysis fails on oversized chunks; durable object storage, malware quarantine, and production CDN evidence remain open |
| Session-secret rotation and hygiene | BLOCKED/P0 | Commit `d7b8652`; `security:rotate-session-secret --dry-run`, `sessionSecretRotation.test.ts` 1/1, `startupSecretLogging.test.ts` 1/1, and type-check pass; the real Secret Manager rotation attempt is blocked by missing Google ADC and deployed log/old-secret invalidation evidence remains external |
| External Secret Manager bootstrap review | PARTIAL/P0 | User-supplied terminal transcript shows `talentsquare-za-prod` billing/API enablement, `SESSION_SECRET` version 1 creation/access, and ADC authentication; the original `workwise-sa-project` API activation remains billing-blocked, and Cloud Run lists zero services, so no deployed workload has been restarted or verified |
| Firebase TalentSquare-Network readiness | BLOCKED/P0 | Firebase CLI version check passed, but Firebase project/auth discovery failed here without ADC; `.firebaserc` and client production config still point at `workwise-sa-project`, `firebase.json` contains a placeholder Auth support email, and `check:firebase-config` fails because `client/.env` is absent |
| Firebase/GCloud account connection | BLOCKED | Firebase CLI reports no authorized accounts, `firebase use` cannot load ADC, and `gcloud` is not installed in this workspace; no project selection or deployment mutation was performed |
| Firebase init safety review | PARTIAL/P0 | User-supplied transcript confirmed Firebase login and `talentsquare-za-prod`; the open starter Firestore rule, generated Data Connect/Firestore artifacts, and Hosting workflow retargeting were restored locally, but the externally created Hosting-admin GitHub service account/secret remains to be reviewed or revoked and Storage remains incomplete |
| Firebase Hosting automation revocation | BLOCKED/P0 | Target is the transcript-created `github-action-978338874` service account and GitHub secret `FIREBASE_SERVICE_ACCOUNT_TALENTSQUARE_ZA_PROD`; this workspace has Firebase CLI auth but no `gcloud` or `gh`, so no deletion/revocation mutation was attempted |

The cycle improves the release candidate but does not change the **NOT READY** verdict: P0-01/P0-02/P0-04/P0-05 require external or broader evidence, legacy job ownership and full tenant coverage remain open, PostgreSQL restore is unproven, and operational/compliance gates are still open.

### 15.8 Capability acceleration layer — configured 2026-07-23 UTC

The following local Codex skills are installed and exposed for the remaining audit passes. They accelerate evidence collection and review; they do not change the readiness score until their outputs are executed and recorded as release evidence.

| Capability | Local installation | Phase acceleration | Activation rule |
|---|---|---|---|
| Playwright CLI | `/home/node/.codex/skills/playwright` | Phase 4/8: browser smoke, critical journeys, screenshots/traces, and accessibility-oriented UI checks | Use against a running isolated/staging build; save artifacts under `output/playwright/` |
| Security best practices | `/home/node/.codex/skills/security-best-practices` | Phase 2: JavaScript/TypeScript web security review and secure-by-default fixes | Use for an explicitly scoped security review; ground findings in file/line evidence |
| Security threat model | `/home/node/.codex/skills/security-threat-model` | Phase 0/2/5: trust boundaries, assets, abuse paths, and mitigation priorities | Use when threat-model scope and deployment assumptions are stated; preserve open assumptions |
| Security ownership map | `/home/node/.codex/skills/security-ownership-map` | Phase 0/5: sensitive-code ownership, bus factor, orphaned security hotspots, and accountability | Use against the repository history; emit bounded CSV/JSON artifacts before assigning owners |

MCP discovery was also run. The currently exposed `codex_apps` resources are Canva, Sites, and default artifact templates; none is a repository deployment, observability, source-control, or database MCP. No external connector was installed or authenticated during this pass because a named provider and access scope were not supplied. Recommended future connector choices are GitHub (CI/PR evidence), Sentry (runtime errors), and a team coordination system (Slack/Teams/Notion); each requires explicit selection and authorization before activation.

Operating convention for the remaining execution cycle: a user message containing `<3>` is the signal to execute the next three best passes. After every two completed passes, provide a brief implementation summary. Every completed pass must update the readiness score and confidence in this report, even when the score remains capped at 28/100 because a hard gate is still open.

### 15.9 `<3>` execution feedback — 2026-07-23 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Replaced the Companies page’s fabricated fixture query with a validated `/api/companies` request. | Commit `7992c6c`; production build path retained. | 28/100; High/medium |
| 2 | Replaced Company Profile’s direct mock company/job imports with public company and job API queries, loading and error states. | Commit `4f970bb`; `pnpm run type-check` and client suite remain green after the batch. | 28/100; High/medium |
| 3 | Tracked scraper child processes and terminated them on operator cancellation without converting the cancelled session to failed. | Commit `81be2f5`; `pnpm run type-check`, client 16 files/103 tests, and `pnpm run build` pass. | 28/100; High/medium |

The browser smoke attempt is recorded as an environment-blocked Phase 4 gate: installable Playwright tooling is present, but the current container image has no usable browser runtime libraries. No browser journey is being counted as passing until the staging/runner image supplies those dependencies.

### 15.10 `<3>` execution feedback — 2026-07-23 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Removed fabricated company AI summaries and cover letters from client fallback paths. | Commit `6b30f2d`; production failures now propagate to the caller. | 28/100; High/medium |
| 2 | Added an explicit Companies-page API error state with no synthetic catalog fallback. | Commit `1497802`; client 16 files/103 tests, type-check, and build remain green. | 28/100; High/medium |
| 3 | Extracted scraper termination control and added regression tests for SIGTERM behavior. | Commit `036d43c`; targeted test 3/3, type-check, client suite, and build pass. | 28/100; High/medium |

### 15.11 `<3>` execution feedback — 2026-07-23 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Removed implicit FAQ fixture fallbacks; only explicit development mock mode can use canned FAQ data. | Commit `4027408`; API errors propagate. | 28/100; High/medium |
| 2 | Added a dedicated Company Profile API failure state. | Commit `e9db1ce`; client 16 files/103 tests, type-check, and build remain green. | 28/100; High/medium |
| 3 | Added bounded SIGKILL escalation for scraper processes that ignore SIGTERM, with timer cleanup. | Commit `ef39126`; cancellation tests 3/3, type-check, client suite, and build pass. | 28/100; High/medium |

### 15.12 `<3>` execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added FAQ API success and failure regression coverage, including category failures. | Commit `f93d871`; targeted FAQ suite 3/3. | 28/100; High/medium |
| 2 | Added a visible Company Profile jobs-query failure state. | Commit `be52d8d`; type-check/build path retained. | 28/100; High/medium |
| 3 | Added regression coverage for the scraper’s bounded SIGKILL decision after SIGTERM. | Commit `abdce0c`; targeted scraper suite 4/4 and type-check pass. | 28/100; High/medium |

### 15.13 `<3>` execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Removed implicit marketing-rule and analytics fixtures unless development mock mode is explicitly enabled. | Commit `42c374e`; non-mock calls now fail visibly instead of fabricating campaign data. | 28/100; High/medium |
| 2 | Added the same explicit-mode guard to AI content, job submission, and location-suggestion paths. | Commit `ca97b1d`; non-mock job-service calls no longer simulate successful production behavior. | 28/100; High/medium |
| 3 | Closed the duplicate `.js` service shadow path and added regression coverage for marketing and job-service guards. | Commit `421fb00`; focused suite 3/3, full client suite 20 files/116 tests, and `pnpm run type-check` pass. | 28/100; High/medium |

### 15.14 P0-priority execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Hardened the competing Firebase Functions profile/file runtime: bearer-token verification, self-profile/admin authorization, callable-function ownership checks, and fail-closed 501 responses for unimplemented legacy handlers. | Commit `768389c`; `node --check functions/index.js` and `pnpm --dir functions run build` pass. This reduces the P0-04 bypass surface, but private object storage, deployment retirement, and canonical route integration remain open. | 28/100; High/medium |

### 15.15 P0-priority execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added a startup regression guard that fails if `server/server/index.ts` logs or directly reads `SESSION_SECRET` for output. | Commit `077c697`; `startupSecretLogging.test.ts` passes 1/1 and `pnpm run type-check` passes. Credential rotation, access review, and historical log purge remain open, so the P0 gate is not closed. | 28/100; High/medium |

### 15.16 P0-05 tenant-isolation execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Extended employer isolation regression coverage to exclude cross-employer jobs and legacy jobs without an owner from employer lists and dashboard metrics. | Commit `0fd0e7e`; `employerRoutes.test.ts` passes 6/6 and `pnpm run type-check` passes. Full CRUD/integration coverage, company ownership policy, and legacy ownership backfill remain open. | 28/100; High/medium |

### 15.17 `<3>` P0-05 tenant-isolation execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added cross-tenant denial coverage for employer job detail reads and edits, completing the missing CRUD read/write assertions. | Commit `7c33634`; employer route suite passes 8/8. | 28/100; High/medium |
| 2 | Added cross-tenant denial coverage for application detail reads, job-level listings, and employer status mutations. | Commit `58fe770`; application route suite passes 8/8 and type-check passes. | 28/100; High/medium |
| 3 | Changed application ownership checks to fail closed for every non-`user`/non-`admin` role, and added an unknown-role regression test. | Commit `b1b907d`; application route suite passes 9/9 and type-check passes. Full integration, company membership, and legacy owner backfill remain open. | 28/100; High/medium |

### 15.18 `<3>` P0-05 tenant-isolation execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added employer status-mutation coverage proving legacy jobs with null ownership cannot be changed. | Commit `6c7e076`; employer route suite passes 9/9. | 28/100; High/medium |
| 2 | Added application-listing and status-mutation coverage proving legacy unowned jobs cannot expose or mutate candidate applications. | Commit `06b4ec2`; application route suite passes 11/11. | 28/100; High/medium |
| 3 | Changed application withdrawal to allow only candidate/admin roles and added an unknown-role regression test. | Commit `8e5fb18`; application route suite passes 12/12 and `pnpm run type-check` passes. Company membership modeling, integration coverage, and owner backfill remain open. | 28/100; High/medium |

### 15.19 `<3>` production-safety execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added a tracked-secret release gate that detects private-key material and non-local credentialed database URLs without printing values. | Commit `897022d`; the gate correctly fails on `.env.production`, identifying the unresolved P0 credential exposure. | 28/100; High/medium |
| 2 | Added regression coverage for the legacy Firebase profile/file and callable processing surface. | Commit `f8b62a6`; security suite 2/2 and `node --check functions/index.js` pass. | 28/100; High/medium |
| 3 | Added a SquareJUMP route security contract covering authenticated user/event paths and admin-only policy/review paths. | Commit `d679951`; route security suite 11/11 passes. | 28/100; High/medium |

### 15.20 Grouped SquareJUMP operations feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added daily authenticated job-event metric aggregation and policy-aware opportunity rescoring inputs. | Commit `9774a82`; type-check passes. | 28/100; High/medium |
| 2 | Added application-link verification with bounded HTTP checks, release-event rescheduling, and a dedicated worker. | Commit `9774a82`; type-check passes; live URL verification and scheduler evidence remain open. | 28/100; High/medium |

### 15.21 `<3>` operational-readiness execution feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added migration regression coverage for the SquareJUMP daily metrics table, uniqueness constraint, and index. | Commit `b92e4c9`; SQL migration suite passes 4/4. | 28/100; High/medium |
| 2 | Added worker safety regression coverage for bounded link checks, bounded match batches, timeouts, and database shutdown. | Commit `d4efffb`; worker suite passes 2/2 and type-check passes. | 28/100; High/medium |
| 3 | Added a tracked-secret gate output regression proving secret values are never printed while unresolved findings remain visible. | Commit `1321773`; gate-output suite passes 1/1; `.env.production` still blocks the release gate. | 28/100; High/medium |

### 15.22 Grouped migration-tooling feedback — 2026-07-24 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Isolated Drizzle schema generation from the canonical hand-authored migration journal. | Commit `96d34fd`; output is directed to ignored `.drizzle-generated/` and type-check passes. | 28/100; High/medium |
| 2 | Added a migration-status CLI that reports applied and pending SQLite/PostgreSQL migrations without mutating state. | Commit `96d34fd`; type-check passes; live PostgreSQL status remains unverified. | 28/100; High/medium |

### 15.23 `<3>` SquareJUMP safeguards execution feedback — 2026-07-25 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added event-integrity coverage for authenticated user, job, exposure-token, and idempotency-key binding. | Commit `70beb83`; event-integrity suite passes 1/1. | 28/100; High/medium |
| 2 | Added notification safety coverage for consent, paused-mode suppression, and the per-user daily delivery cap. | Commit `1eb0e85`; worker safety suite passes 3/3. | 28/100; High/medium |
| 3 | Added application-link release-gate coverage for bounded HEAD/GET checks, verified/broken state, and release-event scheduling. | Commit `f81ad21`; worker safety suite passes 4/4 and type-check passes. | 28/100; High/medium |

### 15.24 Grouped upload-volume and delivery feedback — 2026-07-25 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Centralized local upload-volume resolution and startup writability checks, including isolated temporary/profile/CV/general subdirectories and a bounded volume-health command. | Commit `ee31d68`; `pnpm run check:upload-volume` passes (0.00 MB / 5120 MB); type-check passes. | 28/100; High/medium |
| 2 | Added bounded image optimization with WebP normalization and metadata, while retaining a safe fallback for malformed legacy image bytes and deterministic persistence-failure cleanup. | Commit `ee31d68`; `fileRoutes.test.ts` passes 7/7. | 28/100; High/medium |
| 3 | Removed fake client lazy wrappers, split Firebase chunks consistently, and made bundle analysis repository-rooted with a configurable hard size gate. | Commit `ee31d68`; `pnpm run analyze:bundle` completes successfully and CI now invokes the enforcing analyzer. | 28/100; High/medium |

### 15.25 Roadmap to a minimum 30/100 — 2026-07-25 UTC

The current **28/100** is a launch-gated score, not a measure of elapsed engineering time. The following is the shortest defensible score-lift path. The score must not be edited upward until the evidence in the final column exists; local unit tests alone are insufficient for the provider, deployment, and data-handling gates.

| Order / timebox | Gate and implementation | Required evidence before credit | Owner / dependency |
|---|---|---|---|
| 1 / 0–2h | **Close P0-02 session-secret exposure.** Rotate the deployed `SESSION_SECRET`, invalidate the old value, remove startup value logging, and scan retained startup/log artifacts for a canary. | Deployment record showing rotation; startup output contains names/status only; log scan contains no canary or secret value. | Platform/Security; production secret manager and log access |
| 2 / 2–6h | **Close P0-03 registration privilege escalation.** Keep `role`, `firebaseUid`, password, and referral ownership server-controlled; reject unexpected fields on both registration routes; review existing privileged accounts. | Negative API/integration tests on both routes; database report of privileged accounts with an owner/reason; no public request can create an admin/employer identity. | Identity/API; production database access and account owner |
| 3 / 6–12h | **Close the canonical P0-04 file/profile boundary.** Require Firebase identity on every profile/file read, write, download, and delete; bind IDs to the authenticated database user; remove or protect any public `/uploads` mount; migrate retained CVs to private storage or document signed-download controls. | Anonymous requests return 401; cross-user requests return 403/404; static enumeration is impossible; private-storage or signed-URL test passes; legacy bypass paths are disabled. | API/Security/Privacy; storage migration decision |
| 4 / 12–20h | **Turn P0-05 local assertions into a two-tenant integration gate.** Seed two employers and candidates in PostgreSQL, exercise job CRUD, application lists/details/status/withdrawal, quarantine null-owner legacy jobs, and prove company membership rules. | Repeatable PostgreSQL integration suite with zero cross-tenant reads/writes, ownership backfill/quarantine report, and rollback-safe migration artifact. | Data/API; PostgreSQL staging database and ownership policy |
| 5 / 20–24h | **Recalculate the score from a clean release candidate.** Run tracked-secret scan, type/build, migration/status, restore rehearsal, startup/readiness, anonymous/cross-tenant smoke, and bundle/upload gates; update the weighted table only from recorded results. | Signed evidence index linked to commit, test output, deployment/restore records, and explicit residual-risk approvals. | Release lead; staging environment and approvers |

**Score-lift rule:** Steps 1–3 are the minimum security evidence package expected to recover at least two points on the next audit recalculation. If the server-side authorization cap still applies after that recalculation, Step 4 is mandatory before claiming **30/100**. A failed or unverifiable step leaves the score at 28 and the verdict **NOT READY**; time spent is never substituted for gate evidence.

### 15.26 P0-02 session-secret rotation execution feedback — 2026-07-25 UTC

| Pass | Implementation | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Added a Secret Manager rotation command that generates 48 random bytes, adds a new version, reads it back in memory for exact verification, and optionally disables previous enabled versions without printing the candidate. | Commit `d7b8652`; `pnpm run security:rotate-session-secret -- --dry-run` passes; no secret value is emitted or persisted. | 28/100; High/medium |
| 2 | Added source-level hygiene regression coverage for rotation output and startup handling. | Commit `d7b8652`; `sessionSecretRotation.test.ts` and `startupSecretLogging.test.ts` pass 2/2; `pnpm run type-check` passes. | 28/100; High/medium |
| 3 | Executed the real rotation command and fail-closed when Google Application Default Credentials were unavailable. | No Secret Manager mutation occurred; command returned exit 1 with a non-sensitive configuration error. Production rotation, workload restart, old-version invalidation, and retained-log scan still require authorized deployment access. | 28/100; High/medium |

### 15.27 P0-02 external bootstrap evidence review — 2026-07-25 UTC

The attached terminal transcript is recorded as **user-supplied evidence and was not independently executed in this workspace**:

| Evidence | Interpretation | Gate status |
|---|---|---|
| `workwise-sa-project` could not enable Secret Manager because no billing account was attached. | The originally documented project is not currently usable for this rotation path. | OPEN |
| New project `talentsquare-za-prod` was created, billed, and had Secret Manager enabled. | A replacement deployment project is provisioned. | PASS for project bootstrap |
| Secret Manager `SESSION_SECRET` version 1 was created and accessed without printing its value. | A new baseline secret exists in the replacement project. This is not proof that an existing production secret was rotated. | PARTIAL |
| ADC authentication was established for the operator account. | The operator can use Google client libraries, subject to IAM and quota policy. | PASS for operator authentication |
| Cloud Run in `africa-south1` returned zero services. | There is no discovered production workload to restart, configure with the secret, or check at `/ready`. | BLOCKED |

**Next required sequence:** deploy the application with `SESSION_SECRET` sourced from `talentsquare-za-prod/SESSION_SECRET` and grant the runtime service account Secret Manager accessor permission; verify `/ready` and startup-log redaction; then add a second version, perform a complete rollout, and disable version 1. Until those workload and log records exist, P0-02 remains open and the readiness score stays **28/100** with **High/medium** confidence.

### 15.28 `<3>` Firebase TalentSquare-Network readiness feedback — 2026-07-25 UTC

| Pass | Implementation / finding | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Audited the Firebase deployment contract. The repository’s default/production aliases still target `workwise-sa-project`; Hosting/Functions are documented as legacy, while the canonical runtime is the bundled Express service. The Auth block also contains `support@undefined.firebaseapp.com`. | `firebase.json`, `.firebaserc`, `docs/deployment-strategy.md`; no Firebase mutation performed. | 28/100; High/medium |
| 2 | Verified Firebase tooling and operator access prerequisites. | `npx -y firebase-tools@latest --version` passed; `firebase use` failed closed because this workspace has no Google ADC/Firebase login. | 28/100; High/medium |
| 3 | Ran the repository Firebase configuration gate and inspected configuration presence without printing values. | `pnpm run check:firebase-config` fails because it loads `client/.env`, which is absent; `client/.env.production` contains configured fields but still targets the old project. | 28/100; High/medium |

**Required TalentSquare-Network configuration before deployment:**

1. Confirm the Firebase project ID for the `TalentSquare-Network` display name. The transcript’s `talentsquare-za-prod` must be confirmed as the Firebase project, not assumed from its GCP display name.
2. Register the production web app and populate `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and the public API key in the deployment configuration. Do not commit Admin SDK keys or service-account JSON.
3. Enable only approved Auth providers: Email/Password and Google initially; configure the verified support email, authorized domains (`localhost` only for development plus the real production domain), email verification/password-reset templates, and MFA for administrator accounts. Do not enable anonymous auth for production.
4. Configure the backend with Workload Identity or an attached runtime service account, `FIREBASE_PROJECT_ID`, the correct storage bucket, Secret Manager access, and the rotated `SESSION_SECRET`. Do not use the tracked `.env.production` service-account material.
5. Keep PostgreSQL as the canonical application database. Enable Firestore or Firebase Storage only for explicitly approved client features, with deny-by-default rules and `request.auth.uid` ownership checks; do not deploy the legacy Firebase Functions path as the primary API.
6. Deploy the bundled Express service to Cloud Run (the transcript showed zero services), run `pnpm run build` and the production validator, verify `/health`, `/ready`, Auth sign-in, an authenticated API request, and private file access. Use Firebase Hosting only if it is intentionally configured as a front door/rewrite to Cloud Run; otherwise do not run the legacy Hosting deploy command.
7. Add rollback, logs/alerts, database backup/restore, and a two-tenant authorization smoke test before changing the readiness score.

### 15.29 `<3>` Firebase/GCloud account connection feedback — 2026-07-25 UTC

| Pass | Action | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Verified Firebase tooling and checked for Google Cloud CLI availability. | `npx -y firebase-tools@latest --version` passed; `gcloud` is not installed in this workspace. | 28/100; High/medium |
| 2 | Checked account/project state without changing resources. | `firebase login:list` reports no authorized accounts; `firebase use` fails closed because ADC is unavailable. | 28/100; High/medium |
| 3 | Started the Firebase no-localhost device-login flow, then cancelled before accepting a one-time authorization code in this chat. | No Firebase account was connected and no project/deployment mutation occurred. | 28/100; High/medium |

**Secure unblock:** on the operator workstation, run `npx -y firebase-tools@latest login --no-localhost`, complete the browser flow locally, then run `npx -y firebase-tools@latest projects:list` and `npx -y firebase-tools@latest use <confirmed-firebase-project-id>`. Install the Google Cloud CLI separately, authenticate the same account, and set the confirmed GCP project before any deployment. Never paste authorization codes, access tokens, service-account JSON, or secret values into chat.

### 15.30 Firebase init safety review — 2026-07-25 UTC

The attached transcript confirms the Firebase project mapping but also records unsafe or incomplete initialization outcomes:

| Finding | Required action | Status |
|---|---|---|
| Shell placeholder syntax | `<confirmed-firebase-project-id>` was interpreted literally by the shell. The confirmed ID is `talentsquare-za-prod`; angle brackets are documentation placeholders, not command text. | Resolved in operator terminal |
| Firestore starter rules | `firestore.rules` now allows unauthenticated read/write until 2026-08-24. Do not deploy these rules; restore/review the repository’s ownership rules before any Firestore deploy. | BLOCKED/P0 |
| Data Connect generation | SDK generation failed on unsupported `_Data` input types after existing schema/query files were overwritten. | BLOCKED; do not deploy or commit generated Data Connect changes |
| Hosting automation | Firebase CLI created two GitHub workflows and a Hosting-admin service account secret. Review branch, build command, permissions, and secret scope before pushing workflow files. | REVIEW REQUIRED |
| Storage setup | Initialization stopped because Firebase Storage was not yet provisioned. | INCOMPLETE |
| Canonical runtime | The repository’s deployment strategy still names bundled Express/Cloud Run as canonical; Firebase Hosting/Functions remain legacy unless deliberately adopted as a Cloud Run front door. | DECISION REQUIRED |

No Firebase deploy was approved or executed from this workspace. The open starter Firestore rule, generated Data Connect schema/query files, generated indexes, and Hosting workflow retargeting were restored to the repository baseline; only harmless final-newline normalization remains in a few restored files. The externally created Hosting-admin GitHub service account/secret was not changed from this workspace and requires separate least-privilege review or revocation. Unrelated user changes remain uncommitted.

### 15.31 Firebase init cleanup execution feedback — 2026-07-25 UTC

| Pass | Cleanup | Evidence | Score / confidence |
|---|---|---|---|
| 1 | Removed the Firebase CLI’s unauthenticated Firestore starter rule from the pending change set. | `firestore.rules` restored to the repository’s prior ownership/admin rules; no Firebase rules deploy executed. | 28/100; High/medium |
| 2 | Restored the pre-init Data Connect schema, connector, queries, seed data, and Firestore indexes after the failed SDK generation. | Target files now differ only by final-newline normalization; the failed generated `_Data` model is no longer pending for commit. | 28/100; High/medium |
| 3 | Undid generated Hosting workflow retargeting to `talentsquare-za-prod` so no new Firebase Hosting deployment path is pushed before an architecture decision. | Both workflow files match their pre-init project/secret references; no workflow or Firebase deployment was pushed. | 28/100; High/medium |

### 15.32 Firebase Hosting automation revocation gate — 2026-07-25 UTC

The Firebase CLI-created Hosting automation credential must be revoked before deployment work continues. The transcript identifies the exact targets without exposing the service-account key:

1. Delete the GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_TALENTSQUARE_ZA_PROD` from `Noxie-dev/workwise-sa`.
2. Delete the Google service account `github-action-978338874@talentsquare-za-prod.iam.gserviceaccount.com`; deleting the account revokes its keys and Hosting-admin access.
3. Revoke the Firebase CLI GitHub OAuth authorization created during `firebase init` from the operator’s GitHub settings.
4. Confirm no workflow references the deleted secret, then run a repository secret scan and review Cloud Audit Logs for the account.

Safe operator commands, after installing/authenticating both CLIs, are:

```bash
gh secret delete FIREBASE_SERVICE_ACCOUNT_TALENTSQUARE_ZA_PROD --repo Noxie-dev/workwise-sa
gcloud config set project talentsquare-za-prod
gcloud iam service-accounts describe \
  github-action-978338874@talentsquare-za-prod.iam.gserviceaccount.com
gcloud iam service-accounts delete \
  github-action-978338874@talentsquare-za-prod.iam.gserviceaccount.com \
  --project talentsquare-za-prod
```

The `describe` step is the final target check; do not substitute a different service account. This workspace has not run the deletion because `gh` and `gcloud` are unavailable. Score remains **28/100** until revocation and audit evidence are recorded.
