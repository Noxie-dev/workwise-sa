# Phase 2 Mock And Demo Inventory

This inventory focuses on active mock/demo behavior that still affects runtime behavior. It excludes test-only mocks.

## Completed In This Pass

- Public home-page categories now call the real `/api/categories` endpoint first and use mock data only as a development fallback in [client/src/components/CategoriesSection.tsx](/workspace/client/src/components/CategoriesSection.tsx)
- Public home-page companies now call the real `/api/companies` endpoint first and use mock data only as a development fallback in [client/src/components/CompaniesSection.tsx](/workspace/client/src/components/CompaniesSection.tsx)
- Test/demo routes were removed from the main application shell in [client/src/core/app.tsx](/workspace/client/src/core/app.tsx)
- Firebase Functions engine was aligned with the repo-supported Node versions in [functions/package.json](/workspace/functions/package.json)

## Remaining High-Priority Mock Paths

| Area | File | Current Behavior | Required Follow-up |
| --- | --- | --- | --- |
| Backend dev fallback data | [server/routes.ts](/workspace/server/routes.ts) | Returns mock categories/companies when DB is unavailable | Replace with explicit degraded-state handling or guaranteed local seed data |
| Dashboard API | [server/routes/dashboard.ts](/workspace/server/routes/dashboard.ts) | Simulates metrics and pagination with mock data | Rebuild from real analytics/storage data |
| Client dashboard services | [client/src/services/dashboardService.ts](/workspace/client/src/services/dashboardService.ts) | Falls back to mock dashboard/recommendation/skills data | Replace with real API-backed responses |
| Root dashboard services | [src/services/dashboardService.ts](/workspace/src/services/dashboardService.ts) | Parallel mock-backed implementation | Move or retire with root `src/` cleanup |
| Job applications auth mapping | [server/routes/jobApplications.ts](/workspace/server/routes/jobApplications.ts) | Uses placeholder user IDs | Replace with Firebase UID to DB user resolution |
| Firebase server fallback | [server/firebase.ts](/workspace/server/firebase.ts) | Falls back to mock services | Replace with stricter environment handling |
| Netlify serverless fallback | [netlify/functions/api.js](/workspace/netlify/functions/api.js) | Uses mock Firebase data when creds are missing | Retire or productionize |
| Employer dashboard | [client/src/pages/employers/EmployerDashboard.tsx](/workspace/client/src/pages/employers/EmployerDashboard.tsx) | Contains incomplete/coming-soon sections | Back with real workflows or reduce exposed surface |
| Marketing rules service | [src/services/marketingRuleService.ts](/workspace/src/services/marketingRuleService.ts) | Uses mock create/update logic | Move or retire with root `src/` cleanup |

## Phase 2 Rule

- Production code should fail explicitly when required dependencies are unavailable
- Development-only fallback data is acceptable only when guarded by dev-only conditions and clearly isolated from production behavior
