# Phase 0 Maturity Matrix

This document is the baseline inventory for moving the repo from mixed maturity to uniformly complete. It assigns each major code area a current maturity tag and a target disposition.

## Tag Definitions

- `production`: Active path with real runtime ownership and no known mock dependency for the main flow
- `partial`: Real code path exists, but important workflow, data, or operational gaps remain
- `mock-backed`: Code path works only because placeholder/demo/fallback behavior is present
- `duplicate`: Overlaps with another active implementation and should not remain a first-class path
- `retire`: Historical, test/demo, or superseded path that should not survive the cleanup program

## Runtime Baseline

| Area | Current Tag | Target Disposition | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `client/` | `partial` | Keep as canonical frontend | [client/src/core/app.tsx](/workspace/client/src/core/app.tsx) | This is the Vite-mounted browser app, but several routes still point to incomplete or demo-backed flows. |
| `server/` | `partial` | Keep as canonical backend | [server/server/index.ts](/workspace/server/server/index.ts) | This is the main application server, but route ownership is split and some flows use placeholder behavior. |
| `shared/` | `production` | Keep | [shared/schema.ts](/workspace/shared/schema.ts) | Shared schema/contracts are a valid core boundary, but contract drift still needs cleanup in later phases. |
| `src/api/v1` | `duplicate` | Migrate into canonical backend ownership | [src/api/index.ts](/workspace/src/api/index.ts) | Mounted into the main server but overlaps with legacy `/api/*` paths in `server/routes.ts`. |
| root `src/` frontend-style code | `duplicate` | Retire or move into `client/` | [src/pages/WiseUp/WiseUpPage.tsx](/workspace/src/pages/WiseUp/WiseUpPage.tsx) | Contains active-looking UI/services that are not the canonical browser app. |
| `functions/` | `partial` | Restrict to supporting Firebase integrations only | [functions/index.js](/workspace/functions/index.js) | Contains TODO-based placeholder implementations and should not own core product workflows. |
| `netlify/functions/` | `mock-backed` | Retire from primary app path | [netlify/functions/api.js](/workspace/netlify/functions/api.js) | Uses mock Firebase behavior and diverges from the Express backend. |
| `dataconnect/` + `dataconnect-generated/` | `partial` | Keep only if tied to retained Firebase flows | [docs/generated/dataconnect/default-connector/README.md](/workspace/docs/generated/dataconnect/default-connector/README.md) | Secondary data path until ownership is clarified. |
| `scrapy_jobs/` | `partial` | Keep as ingestion subsystem | [scrapy_jobs/run_scrapers.py](/workspace/scrapy_jobs/run_scrapers.py) | Real subsystem with evolving source support and compliance/quality work still needed. |

## Canonical Ownership Decisions

- Frontend owner: `client/`
- Backend owner: `server/`
- Transitional API source: `src/api/v1` may remain only while its endpoints are migrated under `server/` ownership
- Serverless owner: Firebase support code may remain for auth/storage integrations; Netlify functions are not a canonical product runtime
- Primary deployment model: the Express app started from [server/server/index.ts](/workspace/server/server/index.ts)

## API Route Inventory

### Canonical backend route groups under `server/`

| Route Source | Current Tag | Target Disposition | Notes |
| --- | --- | --- | --- |
| [server/routes.ts](/workspace/server/routes.ts) | `partial` | Break into canonical route modules and keep | Main active `/api/*` route registration, but still includes dev mock fallbacks and mixed concerns. |
| [server/routes/index.ts](/workspace/server/routes/index.ts) | `duplicate` | Merge into one route registration model | Duplicates the route-registration concept already implemented in `server/routes.ts`. |
| [server/routes/files.ts](/workspace/server/routes/files.ts) | `partial` | Keep | Real upload surface, needs verification of auth/storage paths. |
| [server/routes/profile.ts](/workspace/server/routes/profile.ts) | `partial` | Keep | Real profile surface, but still part of split ownership story. |
| [server/routes/jobApplications.ts](/workspace/server/routes/jobApplications.ts) | `partial` | Keep | Uses placeholder user mapping and incomplete authorization behavior. |
| [server/routes/jobFavorites.ts](/workspace/server/routes/jobFavorites.ts) | `partial` | Keep | Real feature surface that needs full integration verification. |
| [server/routes/content.ts](/workspace/server/routes/content.ts) | `partial` | Keep | Candidate/employer content operations need scope validation and tests. |
| [server/routes/dashboard.ts](/workspace/server/routes/dashboard.ts) | `mock-backed` | Keep only after real metrics/data integration | Explicit mock/pagination simulation remains. |
| [server/routes/billing.ts](/workspace/server/routes/billing.ts) | `foundation` | Keep and finish | Provider-neutral Phase 1 billing surface. Replaces the removed Stripe-specific `server/routes/payments.ts` scaffold. |
| [server/routes/entitlements.ts](/workspace/server/routes/entitlements.ts) | `foundation` | Keep and finish | Central entitlement read surface backed by the Phase 1 monetization model. |
| [server/routes/notifications.ts](/workspace/server/routes/notifications.ts) | `partial` | Keep | Large surface area, needs maturity validation. |
| Candidate access routes | `not-implemented` | Rebuild on identity and entitlements | Removed the unmounted candidate scaffold because it depended on nonexistent subscription, credit, storage, and employer-access contracts. |
| [server/routes/scraping.ts](/workspace/server/routes/scraping.ts) | `partial` | Keep | Real operational subsystem. |
| [server/routes/authMonitoring.ts](/workspace/server/routes/authMonitoring.ts) | `partial` | Keep | Admin/ops feature, depends on real auth and monitoring data. |
| [server/routes/aiRoutes.ts](/workspace/server/routes/aiRoutes.ts) | `partial` | Keep only if backed by real AI services | Depends on placeholder implementations in current AI service layer. |

### Transitional route groups under `src/api/v1`

| Route Source | Current Tag | Target Disposition | Notes |
| --- | --- | --- | --- |
| [src/api/v1/routes/jobs.ts](/workspace/src/api/v1/routes/jobs.ts) | `duplicate` | Migrate or retire | Overlaps with `/api/jobs*` routes in `server/routes.ts`. |
| [src/api/v1/routes/categories.ts](/workspace/src/api/v1/routes/categories.ts) | `duplicate` | Migrate or retire | Overlaps with canonical category routes. |
| [src/api/v1/routes/companies.ts](/workspace/src/api/v1/routes/companies.ts) | `duplicate` | Migrate or retire | Overlaps with canonical company routes. |
| [src/api/v1/routes/cv.ts](/workspace/src/api/v1/routes/cv.ts) | `duplicate` | Migrate or retire | Overlaps with canonical CV generation routes. |
| [src/api/v1/routes/users.ts](/workspace/src/api/v1/routes/users.ts) | `partial` | Migrate into canonical backend ownership | Real user operations exist here but should not live in a parallel API tree. |
| [src/api/v1/routes/wiseup.ts](/workspace/src/api/v1/routes/wiseup.ts) | `partial` | Migrate into canonical backend ownership | Real feature area with auth-dependent behavior. |
| [src/api/v1/routes/top-hiring.ts](/workspace/src/api/v1/routes/top-hiring.ts) | `partial` | Migrate into canonical backend ownership | Analytics path should stay only if adopted by the main backend. |
| [src/api/v1/routes/jobs.ingest.ts](/workspace/src/api/v1/routes/jobs.ingest.ts) | `partial` | Keep behavior, move ownership under `server/` | Ingestion is valid but ownership should be unified. |

## Frontend Page Inventory

### Canonical routed pages under `client/src/pages`

| Page Group | Current Tag | Target Disposition | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Home/public marketing pages | `partial` | Keep | [client/src/pages/HomeSimple.tsx](/workspace/client/src/pages/HomeSimple.tsx) | Canonical public entry path exists, but old/demo pages still coexist. |
| Jobs listing | `production` | Keep | [client/src/pages/Jobs.tsx](/workspace/client/src/pages/Jobs.tsx) | Active and routed in app shell. |
| Job details | `partial` | Keep | [client/src/pages/JobDetails.tsx](/workspace/client/src/pages/JobDetails.tsx) | File exists, but app routing currently sends `/jobs/:id` to `Jobs`, not `JobDetails`. |
| User profile and profile setup | `partial` | Keep | [client/src/pages/UserProfile.tsx](/workspace/client/src/pages/UserProfile.tsx) | Core user flow exists but is not uniformly complete. |
| CV builder/resources | `partial` | Keep | [client/src/pages/CVBuilder.tsx](/workspace/client/src/pages/CVBuilder.tsx) | Valuable feature area with later integration/testing work needed. |
| WiseUp | `partial` | Keep | [client/src/pages/WiseUp/WiseUpPage.tsx](/workspace/client/src/pages/WiseUp/WiseUpPage.tsx) | Real product surface with parallel implementations elsewhere. |
| Admin pages | `partial` | Keep | [client/src/pages/AdminDashboard.tsx](/workspace/client/src/pages/AdminDashboard.tsx) | Needs real role enforcement and backend-backed completeness. |
| Employer pages | `mock-backed` | Keep only after API-backed completion | [client/src/pages/employers/EmployerDashboard.tsx](/workspace/client/src/pages/employers/EmployerDashboard.tsx) | Employer feature area is present but not production-complete. |
| Diagnostics/test pages (`ColorTest`, `TestPage`, `FooterTest`, `SimpleTest`, `FirebaseDiagnostics`) | `retire` | Retire from production app shell | [client/src/core/app.tsx](/workspace/client/src/core/app.tsx) | These should not remain as first-class user routes. |
| Legacy alternates (`Home.tsx`, `AboutUsPage.jsx`, `TermsOfService.tsx`, `HomeSimple.tsx` vs older pages) | `duplicate` | Rationalize and keep one path | [client/src/pages/Home.tsx](/workspace/client/src/pages/Home.tsx) | Multiple overlapping public pages imply unfinished cleanup. |

### Parallel page implementations under root `src/pages`

| Page Group | Current Tag | Target Disposition | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Marketing Rules | `duplicate` | Move or retire | [src/pages/MarketingRulesPage.tsx](/workspace/src/pages/MarketingRulesPage.tsx) | Parallel to canonical client page. |
| WiseUp bookmarks/page/components | `duplicate` | Move needed parts into `client/` or retire | [src/pages/WiseUp/WiseUpBookmarksPage.tsx](/workspace/src/pages/WiseUp/WiseUpBookmarksPage.tsx) | Root `src/` should not remain a second frontend surface. |
| Refactored profile setup fragments | `duplicate` | Fold into canonical profile setup flow | [src/pages/ProfileSetup_Refactored.tsx](/workspace/src/pages/ProfileSetup_Refactored.tsx) | Migration artifact. |
| Salary guide/blog/resource pages | `duplicate` | Move or retire | [src/pages/resources/SalaryGuide.tsx](/workspace/src/pages/resources/SalaryGuide.tsx) | Overlaps with client pages. |

## Service Inventory

### Canonical client services

| Service Group | Current Tag | Target Disposition | Evidence | Notes |
| --- | --- | --- | --- | --- |
| API wiring and shared client services | `partial` | Keep | [client/src/services/apiClient.ts](/workspace/client/src/services/apiClient.ts) | Canonical client-side API boundary. |
| Job/company/profile/CV services | `partial` | Keep | [client/src/services/jobService.ts](/workspace/client/src/services/jobService.ts) | Real service surfaces, but some flows still mismatch backend maturity. |
| Dashboard and employer services | `mock-backed` | Keep only after real backend integration | [client/src/services/dashboardService.ts](/workspace/client/src/services/dashboardService.ts) | Explicit mock fallback behavior remains. |
| `client/src/services/mockData.ts` | `retire` | Retire | [client/src/services/mockData.ts](/workspace/client/src/services/mockData.ts) | Useful only during transition. |
| Duplicate job services (`jobService.js`, `jobService.ts`, `jobsService.ts`) | `duplicate` | Collapse into one canonical service surface | [client/src/services/jobService.js](/workspace/client/src/services/jobService.js) | Service sprawl indicates unfinished migration. |

### Parallel root `src/services`

| Service Group | Current Tag | Target Disposition | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `src/services/dashboardService.ts` | `duplicate` | Move or retire | [src/services/dashboardService.ts](/workspace/src/services/dashboardService.ts) | Overlaps with client dashboard service and includes mock fallback behavior. |
| `src/services/profileService.ts` | `duplicate` | Move or retire | [src/services/profileService.ts](/workspace/src/services/profileService.ts) | Parallel service surface outside canonical frontend. |
| `src/services/wiseupService.ts` | `duplicate` | Move or retire | [src/services/wiseupService.ts](/workspace/src/services/wiseupService.ts) | Parallel WiseUp service surface. |
| `src/services/marketingRuleService.ts` | `duplicate` | Move or retire | [src/services/marketingRuleService.ts](/workspace/src/services/marketingRuleService.ts) | Parallel page/service ownership. |
| `src/services/authService.ts` | `partial` | Migrate into canonical ownership | [src/services/authService.ts](/workspace/src/services/authService.ts) | Auth should live under the canonical application boundaries only. |

### Backend services

| Service Group | Current Tag | Target Disposition | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Secret/cache/metrics/auth-monitoring services | `production` | Keep | [server/services/secretManager.ts](/workspace/server/services/secretManager.ts) | Core operational building blocks are valid. |
| Auth/token-refresh services | `partial` | Keep and finish | [server/services/enhancedAuthService.ts](/workspace/server/services/enhancedAuthService.ts) | Real subsystem, but user mapping and refresh lifecycle need completion. |
| AI services | `partial` | Keep only if backed by real providers | [server/services/aiService.ts](/workspace/server/services/aiService.ts) | Placeholder output paths still exist. |
| Job ingestion and scoring services | `partial` | Keep | [server/services/jobIngestionService.ts](/workspace/server/services/jobIngestionService.ts) | Real subsystem with integration and quality work still needed. |

## Product Surface Definition Of Done

### Jobs

- Public listings, details, filters, and featured jobs use one canonical API surface
- No route duplication between `/api/*` and `/api/v1/*` for the same job workflows
- Saved jobs and related company data resolve from real persisted records

### Applications

- Candidate can apply, review application history, and withdraw/update where supported
- Employer can review and manage applications
- Identity is resolved through real Firebase UID to database user mapping

### Employer Tools

- Employer dashboard, posting, candidate browse, and analytics use real backend data
- Permissions are role-based and not email- or placeholder-based
- Any billing path is either complete or explicitly removed from scope

### Profile And CV

- User profile reads and writes persist correctly
- Avatar/CV/file uploads work in the chosen storage path
- AI/CV helpers are clearly production or clearly excluded

### WiseUp

- Content, bookmarks, ads/impressions, and user state live behind one canonical API and UI path
- Parallel `src/pages` and `client/src/pages` WiseUp ownership is resolved

### AI

- Each public AI endpoint has a real provider-backed implementation, quota handling, and error path
- Any non-production experiment is hidden from the main app

### Scraping And Ingestion

- Sources have declared readiness states
- Orchestration, normalization, ingest validation, and persistence are observable
- Failed batches are diagnosable without manual code inspection
