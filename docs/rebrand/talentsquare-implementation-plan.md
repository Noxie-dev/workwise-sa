# TalentSquare implementation plan

## Scope rule

This plan changes product-facing language before internal storage and API names. The
initial implementation must not rename Drizzle tables, `/api/jobs`, job ingestion,
authentication, uploads, employer workflows, `wiseup_*` tables, or billing codes.

## Phase 1 — Shared brand foundations

- **Objective:** introduce one typed source for TalentSquare labels, routes, tagline,
  asset references, and North Star colour.
- **Areas:** `client/src/config/brand.ts`, reusable brand primitives.
- **Dependencies:** none.
- **Implementation:** expose brand name, products, route aliases, and CSS-compatible
  colour values; use primitives rather than hard-coded new brand strings.
- **Acceptance:** new pages and navigation import the configuration; no new repeated
  product constants are introduced.
- **Tests:** TypeScript check and route smoke test.
- **Rollback:** remove consumers; no persisted data changes.
- **Risk:** Low. **Database/API/environment/deployment:** none.

## Phase 2 — Brand assets and metadata

- **Objective:** replace approved wordmark/favicon/social assets and default metadata.
- **Areas:** `client/index.html`, `client/public/site.webmanifest`, `Header`, `Footer`,
  Helmet components, `client/public/images`.
- **Dependencies:** approved brand asset pack and domain decision.
- **Implementation:** change source assets then build; never edit `public/assets`.
- **Acceptance:** browser title, manifest, favicon, and social preview use approved assets.
- **Tests:** build, asset-import check, PWA smoke test.
- **Rollback:** restore source-asset references.
- **Risk:** Medium. **Deployment:** requires cache invalidation; **domain/legal:** approval required.

## Phase 3 — Global navigation and layout

- **Objective:** make Square Jobs, SquareUp, Salary Hub, Talent Passport, and TradeSquare discoverable.
- **Areas:** `client/src/components/{Header,Footer}.tsx`, brand primitives.
- **Dependencies:** Phase 1 routes.
- **Implementation:** update labels and links without removing legacy URLs.
- **Acceptance:** desktop/mobile navigation and footer links resolve.
- **Tests:** responsive manual smoke test, accessibility-name assertions.
- **Rollback:** restore navigation configuration.
- **Risk:** Low. **Database/API:** none.

## Phase 4 — WorkWise to TalentSquare visible-copy migration

- **Objective:** update user-facing site copy and page metadata.
- **Areas:** active `client/src` pages and current README/API docs only.
- **Dependencies:** legal/domain/email decisions for legal pages.
- **Implementation:** migrate copy in small groups; do not bulk replace source identifiers.
- **Acceptance:** no visible WorkWise labels remain in approved product surfaces.
- **Tests:** page snapshots, title/meta checks.
- **Rollback:** per-page commits.
- **Risk:** Medium due to legal and support-copy accuracy. **Infrastructure:** no change yet.

## Phase 5 — Square Jobs product-facing migration

- **Objective:** present job discovery and employer flows as Square Jobs.
- **Areas:** jobs pages, `Header`, `Footer`, employer copy, `/square-jobs` alias.
- **Dependencies:** Phase 1.
- **Implementation:** retain `/jobs`, `/api/jobs`, `jobs`, and `jobApplications`.
- **Acceptance:** legacy and new entry URLs work, applications and saving jobs remain unchanged.
- **Tests:** existing job/API/application tests plus alias test.
- **Rollback:** remove alias and restore copy only.
- **Risk:** Low. **Database/API:** explicitly none.

## Phase 6 — SquareUp migration

- **Objective:** rename WiseUp visibly while retaining learning contracts.
- **Areas:** `client/src/pages/WiseUp/**`, navigation, `/square-up` alias.
- **Dependencies:** Phase 1.
- **Implementation:** keep `WiseUpService`, `wiseup_*`, migrations, and client service names.
- **Acceptance:** `/wise-up` and `/square-up` render equivalent content and progress/bookmark requests stay unchanged.
- **Tests:** WiseUp client tests, backend service tests, alias test.
- **Rollback:** remove alias/copy changes.
- **Risk:** Medium. **Database/API:** no rename.

## Phase 7 — Salary Hub

- **Objective:** make the existing calculator the first module of Salary Hub.
- **Areas:** new `SalaryHub` page, `SalaryGuide`, salary components, route aliases.
- **Dependencies:** Phase 1.
- **Implementation:** wrap `SalaryCalculator`; add clearly unavailable extension cards for conversions/comparisons. Do not alter tax formulas.
- **Acceptance:** `/salary-hub` displays working calculator and clear non-legal disclaimers; old salary-guide URL remains.
- **Tests:** salary hook/component tests and route smoke test.
- **Rollback:** route/page removal only.
- **Risk:** Medium because pay/tax copy must remain accurate. **Database/API:** none.

## Phase 8 — Talent Passport scaffold

- **Objective:** provide a candidate-owned identity/readiness hub without a new profile system.
- **Areas:** new page plus shared product shell; links to profile, profile setup, CV builder.
- **Dependencies:** existing auth/profile routes.
- **Implementation:** show real workflow links and typed empty states for verification, certificates, licences, sharing, and documents not yet persisted.
- **Acceptance:** no fabricated candidate data; all existing links resolve.
- **Tests:** unauthenticated and authenticated route smoke tests.
- **Rollback:** delete page/route only.
- **Risk:** Low. **Database/API:** no new contracts.

## Phase 9 — TradeSquare scaffold

- **Objective:** establish an entry point for artisan and trade opportunities.
- **Areas:** new page, shared cards/shell, links to jobs, SquareUp, Passport.
- **Dependencies:** Phase 1 and existing routes.
- **Implementation:** use typed trade-category data and explicit empty states; no counts, marketplace, payments, or fake opportunities.
- **Acceptance:** coherent South African terminology, accessible navigation, no unsupported promises.
- **Tests:** route/component smoke test.
- **Rollback:** delete page/route only.
- **Risk:** Low. **Database/API:** none.

## Phase 10 — Compatibility routes and redirects

- **Objective:** preserve bookmarks and inbound links.
- **Areas:** `client/src/core/app.tsx`, later Netlify/hosting redirect configuration.
- **Dependencies:** route ownership confirmation and SEO decision.
- **Implementation:** aliases first; choose permanent redirects only after analytics/domain approval.
- **Acceptance:** old paths resolve, no duplicate router ownership, canonical strategy documented.
- **Tests:** direct navigation and refresh in production build.
- **Rollback:** remove alias routes.
- **Risk:** Medium for SEO. **Deployment:** likely later redirect rules.

## Phase 11 — Tests and QA

- **Objective:** prove safe migration without masking existing debt.
- **Areas:** router, navigation, visual/snapshot, a11y and existing job/WiseUp/salary tests.
- **Dependencies:** all implementation phases.
- **Implementation:** run actual root scripts: `pnpm run type-check`, `pnpm run lint`, targeted tests, and `pnpm run build`.
- **Acceptance:** new route tests pass; failures are classified as pre-existing or introduced.
- **Rollback:** revert only introduced changes.
- **Risk:** Medium due to existing duplicated frontend paths.

## Phase 12 — Documentation and deployment checks

- **Objective:** prepare later operational migration without changing infrastructure prematurely.
- **Areas:** README, server docs, Swagger, Netlify/Firebase/monitoring documentation.
- **Dependencies:** owner answers on legal name, domain, emails, analytics, billing, infrastructure.
- **Implementation:** create change tickets for domain, sender, Firebase, Netlify, billing, analytics, and observability identifiers.
- **Acceptance:** no ambiguous production hostname or legal-entity claim remains.
- **Rollback:** documentation-only until approved deployment work begins.
- **Risk:** High for external systems. **Database/API/environment/deployment:** separate approvals required.

## Change classification matrix

| Change type | Initial release | Later approved migration |
| --- | --- | --- |
| Visual/product naming | Yes | Complete long-tail copy pass |
| Routes | Aliases only | Canonicals/redirects after SEO approval |
| Internal code names | No | Gradual adapters if value is demonstrated |
| Database | No | Only with migration and compatibility plan |
| API contracts | No | Versioned API migration only |
| Infrastructure | No | Separate operational change |

## Owner decisions required before later phases

1. Legal entity/trading name and approved legal copy.
2. Domain, email sender, support mailbox, and social-handle migration.
3. Final asset pack and Open Graph image.
4. Billing and WorkWise Plus mapping.
5. SEO canonical/redirect strategy.
6. Analytics and monitoring identifier migration.

