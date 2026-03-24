# Phase 1 Route Ownership Map

This document records the canonical destination for each active API surface and the first consolidation decisions implemented in Phase 1.

## Canonical Rule

- Public product backend ownership belongs in `server/`
- `src/api/v1` is transitional only
- New routes should not be added to parallel trees for an already-owned capability

## Active Route Map

| Capability | Current Sources | Canonical Destination | Phase 1 Decision |
| --- | --- | --- | --- |
| Categories | [server/routes.ts](/workspace/server/routes.ts), [src/api/v1/routes/categories.ts](/workspace/src/api/v1/routes/categories.ts) | `server/` | Keep `server/routes.ts` as owner, migrate or retire `src/api/v1` duplicate |
| Companies | [server/routes.ts](/workspace/server/routes.ts), [src/api/v1/routes/companies.ts](/workspace/src/api/v1/routes/companies.ts) | `server/` | Keep `server/routes.ts` as owner, migrate or retire `src/api/v1` duplicate |
| Jobs | [server/routes.ts](/workspace/server/routes.ts), [src/api/v1/routes/jobs.ts](/workspace/src/api/v1/routes/jobs.ts) | `server/` | Keep `server/routes.ts` as owner, migrate or retire `src/api/v1` duplicate |
| CV/AI CV helpers | [server/routes.ts](/workspace/server/routes.ts), [src/api/v1/routes/cv.ts](/workspace/src/api/v1/routes/cv.ts) | `server/` | Keep `server/` ownership, retire duplicate versioned surface unless versioning is rebuilt centrally |
| Users | [src/api/v1/routes/users.ts](/workspace/src/api/v1/routes/users.ts), [server/routes.ts](/workspace/server/routes.ts) | `server/` | Migrate user operations into canonical backend modules |
| WiseUp | [src/api/v1/routes/wiseup.ts](/workspace/src/api/v1/routes/wiseup.ts), [server/wiseup.ts](/workspace/server/wiseup.ts) | `server/` | Migrate API ownership into backend route modules |
| Job ingest | [src/api/v1/routes/jobs.ingest.ts](/workspace/src/api/v1/routes/jobs.ingest.ts), [server/services/jobIngestionService.ts](/workspace/server/services/jobIngestionService.ts) | `server/` | Keep behavior, move route ownership into `server/` |
| Storage/files | [server/routes/files.ts](/workspace/server/routes/files.ts) | `server/` | Keep |
| Profile | [server/routes/profile.ts](/workspace/server/routes/profile.ts) | `server/` | Keep |
| Job applications | [server/routes/jobApplications.ts](/workspace/server/routes/jobApplications.ts) | `server/` | Keep and finish |
| Favorites | [server/routes/jobFavorites.ts](/workspace/server/routes/jobFavorites.ts) | `server/` | Keep and finish |
| Candidates | [server/routes/candidates.ts](/workspace/server/routes/candidates.ts) | `server/` | Keep and finish |
| Notifications | [server/routes/notifications.ts](/workspace/server/routes/notifications.ts) | `server/` | Keep and finish |
| Payments | [server/routes/payments.ts](/workspace/server/routes/payments.ts) | `server/` | Keep only if feature remains in scope |
| Scraping orchestration | [server/routes/scraping.ts](/workspace/server/routes/scraping.ts) | `server/` | Keep |

## Consolidation Work Completed

- Removed the unused duplicate route-registration module at `server/routes/index.ts`
- Confirmed the live server boot path uses [server/server/index.ts](/workspace/server/server/index.ts) and [server/routes.ts](/workspace/server/routes.ts)
- Moved `/api/v1` ownership into [server/routes/v1.ts](/workspace/server/routes/v1.ts) and mounted it directly from [server/server/index.ts](/workspace/server/server/index.ts)
- Reduced [src/api/index.ts](/workspace/src/api/index.ts) to a compatibility re-export instead of a live route owner
- Removed test/demo-only routes from the main browser app shell in [client/src/core/app.tsx](/workspace/client/src/core/app.tsx)

## Remaining Phase 1 Work

- Split [server/routes.ts](/workspace/server/routes.ts) into canonical route modules instead of one mixed registration file
- Migrate retained `src/api/v1` routes into `server/`
- Move or retire root `src/pages` and `src/services` duplicates
- Update README and repo index after the code moves are complete
