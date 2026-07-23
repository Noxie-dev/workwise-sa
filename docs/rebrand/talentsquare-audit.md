# TalentSquare rebrand audit

## Executive summary

The production frontend entry point is `client/src/main.tsx`, which renders
`client/src/core/app.tsx`. `client/src/App.tsx` is a parallel, currently unused
router. The safest first release is a product-facing migration: use TalentSquare
labels and new public aliases while preserving the `jobs`, `jobApplications`,
`wiseup_*`, `/api/jobs`, upload, and employer contracts.

There are three migration classes:

1. **Safe now:** visible labels, shared metadata configuration, global navigation,
   non-destructive page shells, and route aliases.
2. **Alias first:** `/wise-up`, `/resources/salary-guide`, and public job URLs.
3. **Separate approved migration:** domains/email addresses, package names,
   Firebase/Netlify projects, billing codes, storage buckets, database tables,
   analytics event names, generated assets, and legal entity references.

No database or API rename is required for the initial TalentSquare release.

## Repository architecture notes

| Area | Status | Notes |
| --- | --- | --- |
| `client/` | Canonical frontend | Root Vite config sets `root: ./client`; `client/src/main.tsx` renders `core/app.tsx`. |
| `server/` | Canonical backend | Express routes, Swagger, jobs, applications, uploads, billing, and WiseUp service. |
| `shared/` | Canonical contracts | Drizzle schemas and Zod contracts. Preserve internal `jobs` and `wiseup_*` names. |
| `client/src/App.tsx` | Parallel legacy router | Not imported by `main.tsx`; update only if deliberately consolidating routers. |
| `src/` | Legacy/parallel source | Not part of the configured Vite root. Treat as historical until ownership is confirmed. |
| `public/`, `public_backup_old/` | Generated/legacy assets | Contains hashed build output and duplicate old assets. Do not edit generated JS. |
| `functions/`, `netlify/functions/` | Legacy/serverless paths | Inspect before deployment migration; not the main Express runtime. |
| `dataconnect*`, `scrapy_jobs/`, `scripts/`, `migrations/`, `archive/` | Supporting or historical | Preserve internal and historical identifiers unless separately approved. |

## Inventory count table

Counts are case-insensitive content matches for `workwise`, `wise up`, `salary
calculator`, or `wwsa` and exclude dependency directories and generated public
asset bodies where noted.

| Subsystem | Files | Classification | Action |
| --- | ---: | --- | --- |
| `client/src` | 89 | Mixed visible copy and internal WiseUp code | Change visible copy now; retain internal contracts. |
| `server` | 23 | API docs, service names, seed URLs, billing names | Split visible/API-doc copy from contracts. |
| `shared` | 4 | Database and shared contract identifiers | Preserve now. |
| `src` | 11 | Legacy runtime/tests | Record; do not treat as current authority. |
| `netlify/functions` | 6 | Legacy deployment path | Audit during deployment migration. |
| `scrapy_jobs` | 2 | Ingestion metadata | Preserve source contracts and user agents. |
| `scripts` | 9 | Deployment/operational references | Separate infrastructure migration. |
| `migrations` | 3 | Historical schema | Never rename retroactively. |
| `public` | 104 | Assets and generated bundles | Replace source assets, then rebuild; do not hand-edit bundles. |
| `docs` + `archive` | 14 | Current and historical documents | Update current docs later; archive stays historical. |

## Detailed inventory and decisions

### Global frontend brand, navigation, and SEO

| Path / symbol | Current value | Proposed value | Risk | Action |
| --- | --- | --- | --- | --- |
| `client/index.html:6` | `WorkWise SA - Find Essential Jobs in South Africa` | TalentSquare title and proposition | Low | Change now. |
| `client/public/site.webmanifest:2-3` and `public/site.webmanifest` | WorkWise names | TalentSquare / TalentSquare | Medium | Change source copy and regenerate/copy assets. |
| `client/src/components/Header.tsx:navigationItems, Logo` | Find Jobs, Wise-Up, WorkWise alt labels | Square Jobs, SquareUp, TalentSquare | Low | Change now through central config. |
| `client/src/components/Footer.tsx` | WorkWise identity, old product links, social URLs | TalentSquare labels; retain unverified social/domain links | Medium | Change labels now; owner approval for links. |
| `client/src/components/CustomHelmet.tsx` and page Helmets | Repeated WorkWise titles/descriptions | Central TalentSquare defaults plus page-specific copy | Low | Migrate incrementally. |
| `client/src/pages/{Home,HomeSimple,Jobs,Companies,Login,Register,Dashboard,UserProfile}` | User-facing titles, descriptions, alt text, welcome copy | TalentSquare / Square Jobs where applicable | Low | Change in copy phase. |
| `client/src/pages/{Terms,TermsOfService,PrivacyPolicy}.tsx` | Legal entity, domains, email addresses | Requires legal and domain owner approval | High | Do not change in scaffold. |
| `client/src/pages/Contact/Contact.tsx`, `ContactForm.tsx` | `@workwisesa.co.za` contacts | Requires mailbox/domain migration | High | Leave and track. |

### Product routes and user-facing labels

| Existing route / area | Proposed public label | Target route strategy | Risk | Action |
| --- | --- | --- | --- | --- |
| `/jobs`, `/jobs/:id` | Square Jobs | Keep canonical; add `/square-jobs` alias | Low | Implement now. |
| employer job flows under `/employers/jobs/*` | Square Jobs for employer-facing copy | Keep routes and APIs | Low | Copy follow-up. |
| `/wise-up` | SquareUp | Keep legacy route; add `/square-up` alias | Low | Implement now. |
| `/resources/salary-guide` | Salary Hub | Keep legacy route; add `/salary-hub` as product page | Low | Implement now. |
| `/profile`, `/profile-setup`, `/cv-builder`, `/upload-cv` | Talent Passport | Compose links to existing flows; add `/talent-passport` | Low | Implement shell now. |
| no existing route | TradeSquare | Add `/trade-square` shell only | Low | Implement now. |
| `/blog-wise` | Blog Wise | Product/brand decision unresolved | Medium | Leave now; decide content-brand relationship. |

### SquareUp / WiseUp internal contracts

| Path / symbol | Current value | Proposed value | Risk | Action |
| --- | --- | --- | --- | --- |
| `client/src/pages/WiseUp/**` | WiseUp page/layout/types | Show SquareUp labels; retain filenames/types initially | Medium | Alias and visible-copy pass only. |
| `client/src/services/{wiseupApiService,wiseupService}.ts` | WiseUp API/client symbols | Internal compatibility names | Medium | Leave. |
| `server/wiseup.ts` | `WiseUpService`, sample content | Keep service/route contract | High | Leave; assess seed copy separately. |
| `shared/wiseup-schema.ts`, `shared/wiseup-contracts.ts` | `wiseup_*` tables and Zod types | Keep database and API contracts | High | Leave. |
| `migrations/0002_add_wiseup_tables.sql` | historical migration | Historical reference | High | Leave. |

### Salary Hub

| Path / symbol | Current value | Proposed value | Risk | Action |
| --- | --- | --- | --- | --- |
| `client/src/pages/resources/SalaryGuide.tsx` | Salary Guide & Calculator page | Existing legacy route target | Low | Keep as compatibility route. |
| `client/src/components/salary/SalaryCalculator.tsx` | Calculator, 2024/2025 tax constants | Embed inside Salary Hub; preserve logic | Medium | Do not change calculations in this task. |
| `client/src/components/salary/{ResultsCard,SalaryInputCard}` | Calculator labels/results | Product label audit later | Medium | Keep computation wording accurate. |
| `client/src/data/salaryData.ts` | WorkWise comment/data | Internal comment only | Low | Later cleanup. |

### Talent Passport capability composition

| Existing capability | Evidence | Scaffold decision |
| --- | --- | --- |
| Profile and profile setup | `UserProfile.tsx`, `ProfileSetup.tsx` | Link directly; do not duplicate profile persistence. |
| CV creation and download | `CVBuilder.tsx` | Link directly. |
| CV upload and extraction | `ProfileSetup.tsx`, file upload service | Link directly; leave document lifecycle unimplemented. |
| Education, skills, experience | `ProfileSetup.tsx`, `CVBuilder.tsx` | Present as readiness sections, not fabricated records. |
| Certificates, licences, verification, sharing | No canonical complete capability found | Explicit empty states and backend-work markers only. |

### TradeSquare capability inventory

| Capability | Existing support | Scaffold decision |
| --- | --- | --- |
| Job discovery and job details | `/jobs`, `/api/jobs` | Link to Square Jobs without filtering promises. |
| Learning content | `/wise-up` | Link to SquareUp. |
| Candidate profile/CV | profile and CV routes | Link to Talent Passport. |
| Trade taxonomy, apprenticeships, licences, contractor marketplace, verified trade profiles | No dedicated schema/API found | Typed static category cards and empty states only. |

### Backend, API, analytics, and billing

| Path / symbol | Classification | Recommended action |
| --- | --- | --- |
| `shared/schema.ts:jobs`, `jobApplications`, favourites | Internal database identifiers | Leave unchanged. |
| `server/routes/publicApi.ts:/api/jobs*` | Public stable API | Leave unchanged. |
| `server/routes/{jobApplications,jobFavorites,dashboard}.ts` | API/workflow contract | Leave unchanged. |
| `server/utils/swagger.ts` | User-facing API documentation | Update title/description only after API hostname decision. |
| `server/server/index.ts` | API server greeting and WiseUp bootstrap log | Update visible greeting later; preserve service symbols. |
| `server/services/{billingService,entitlementService,candidatePromotionService}.ts` | `workwise_plus` plan/source identifiers | Compatibility-sensitive; retain until billing migration is approved. |
| `shared/monetization.ts` | `wiseup-inline` placement ID | Analytics/monetization identifier; retain and document mapping. |
| `server/utils/enhanced-logger.ts` | `workwise-api` service metadata | Infrastructure identifier; change only with observability migration. |
| `monitoring/grafana/dashboards/workwise-dashboard.json` | Monitoring resource | Infrastructure migration. |

### Assets, deployment, and infrastructure

| Item | Current value | Action |
| --- | --- | --- |
| `client/public/images/workwise-logo-full.svg`, `workwisesa-logo-hero-image.png` | Old source assets | Replace after approved TalentSquare assets exist. |
| `client/public/images/{header-logo,footer-logo,hero-logo}.*` | Product assets with unclear source ownership | Create asset map; do not rename/delete yet. |
| `public/assets/**`, `public_backup_old/**` | Generated hashed bundles and historical assets | Rebuild or archive; never bulk-edit. |
| `package.json`, `server/package.json`, lockfiles | WorkWise package names | Infrastructure/package identity decision; leave now. |
| Firebase project JSON, service accounts, `firebase.json`, `.env*` | Project and credential boundary | Do not inspect values or rename in this migration. |
| `netlify.toml`, Netlify functions | Deployment identifier boundary | Separate deployment migration. |
| `server/docs/websocket.md`, `README.md` | Current docs/hostnames | Update after domain/API endpoint decisions. |
| `archive/**`, `public_backup_old/**` | Historical material | Preserve and label historical; no current product edits. |

## Route migration map

| Legacy/current | New public entry | Initial behaviour |
| --- | --- | --- |
| `/jobs` | `/square-jobs` | `/jobs` remains canonical; `/square-jobs` redirects to it. |
| `/jobs/:id` | `/jobs/:id` | Unchanged. |
| `/wise-up` | `/square-up` | Both render the same page. |
| `/resources/salary-guide` | `/salary-hub` | Legacy route remains; Salary Hub uses the same calculator. |
| `/profile`, `/profile-setup`, `/cv-builder` | `/talent-passport` | Passport links to existing workflows. |
| N/A | `/trade-square` | New shell; no marketplace APIs. |

## Asset migration map

1. Approve TalentSquare wordmark, North Star yellow square, favicon, PWA icons, Open Graph image, and social avatar variants.
2. Add source assets under `client/public/images/talentsquare/` or the existing approved asset convention.
3. Update `Header`, `Footer`, `client/index.html`, and `site.webmanifest` references.
4. Run `pnpm run copy-assets` and build to regenerate `dist/public`.
5. Do not rename or directly mutate hashed files under `public/assets`.

## SEO and metadata checklist

- [ ] Centralize default title, description, social image, canonical host, and product labels.
- [ ] Update `client/index.html` and PWA manifest after assets are approved.
- [ ] Update page Helmets for home, jobs, SquareUp, Salary Hub, Passport, TradeSquare, auth, employers, and resources.
- [ ] Decide whether old `workwisesa.co.za` canonical URLs and email addresses remain valid.
- [ ] Add redirect/canonical rules only after hosting/domain owner approval.
- [ ] Verify robots, sitemap, Open Graph, and social preview assets.

## Infrastructure and environment checklist

- [ ] Map current production domains, Firebase project IDs, storage buckets, Netlify site, analytics, monitoring, and email sender domains.
- [ ] Decide whether `workwise_plus` is renamed visually only or also in billing providers.
- [ ] Preserve `/api/jobs`, database table names, and ingestion contracts during product launch.
- [ ] Establish event-name aliases before renaming analytics/monetization labels.
- [ ] Rotate or migrate credentials only in a separately approved operational change.

## Test and documentation impact

- Router tests should cover legacy and new public aliases.
- Existing WiseUp, job, profile, and salary tests remain contract tests and should not need schema rewrites.
- Snapshot assertions and accessibility labels with WorkWise text need targeted updates.
- Update README and current server docs after infrastructure ownership decisions.
- Retain `archive/**` as historical evidence.

## Unresolved questions and likely breaking changes

1. Is TalentSquare a legal-entity change, a trading-name change, or product branding only?
2. Are existing `@workwisesa.co.za` mailboxes, social handles, and domains retained during transition?
3. Does “Blog Wise” become SquareUp editorial content, a separate product, or remain unchanged?
4. Is `WorkWise Plus` renamed, and if so how are billing/provider plan IDs mapped?
5. Which source assets are approved for the new wordmark and North Star square?
6. Are `/jobs` and `/wise-up` to remain canonical permanently, or should SEO canonicals move after traffic analysis?

Breaking risk is high only for legal/domain, billing, infrastructure, database, analytics, and external asset changes. The initial frontend route aliases and shells are low risk.

## Suggested migration order

1. Ship central brand configuration, page shells, and aliases.
2. Update visible navigation, headings, metadata, and accessibility copy.
3. Replace approved source assets and manifest metadata.
4. Complete legal/domain/email/SEO approvals and redirects.
5. Migrate analytics, billing, infrastructure, and external identifiers under separate rollback plans.

