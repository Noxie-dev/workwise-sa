# Implementation Truth Audit

This audit compares the strategic intent in the research documents with the code that is actually live in the current repo shape.

Documents reviewed:

- [docs/archive/initial-docs/WWSA-Research-doc.md](/workspace/docs/archive/initial-docs/WWSA-Research-doc.md)
- [docs/archive/initial-docs/Job Platform Design Analysis_.md](/workspace/docs/archive/initial-docs/Job Platform Design Analysis_.md)
- [docs/archive/initial-docs/South African Job Board Scraping_.md](/workspace/docs/archive/initial-docs/South African Job Board Scraping_.md)
- [docs/project/README.md](/workspace/docs/project/README.md)
- [docs/project/index.md](/workspace/docs/project/index.md)

## Audit Summary

| Area | Research Intent | Current Reality | Audit Result |
| :--- | :--- | :--- | :--- |
| Monetization | Ad-led revenue with measured inventory and mobile-safe placement | Internal WiseUp ads exist, impression tracking exists, but there is no Google AdSense, AdMob, header bidding, ad-slot inventory service, or advertiser analytics pipeline | Partial foundation, major gap |
| Aggregation | Multi-source South African ingestion engine | Gumtree, Job Mail, and Bizcommunity spiders exist; ingest contracts and fingerprint dedup exist; orchestration is still CLI/manual and entity resolution is still basic | Partial foundation, major gap |
| Candidate funnel | Search, save, apply, profile and notifications | Search and favorites/bookmarks are implemented in multiple places; notifications exist; several employer and tracking flows remain uneven or sample-backed | Partial foundation |
| Employer funnel | Candidate management and ATS-style workflows | Employer-facing pages exist, but a cohesive employer operations backend is still not represented as a complete ATS | Material gap |
| Mobile efficiency | Low-data mobile-first experience | Bundle splitting exists and routes are lazy loaded, but there was no service-worker registration and no offline cache strategy before this scaffolding pass | Partial foundation, major gap |
| Compliance | POPIA-aware, controlled scraping and source governance | Compliance middleware exists and strips contact data; there was no explicit source legal registry or scrape gating registry before this scaffolding pass | Partial foundation, major gap |
| SMS delivery | SMS/low-cost notification channel for job seekers | Notification models and settings exist, but no provider-backed SMS delivery layer was present | Major gap |

## Corrections To The Suggested Gaps

Some of the suggested gaps were directionally right, but overstated the absence of underlying work:

- Ad-tech is not entirely absent.
  The repo already has WiseUp ad tables and impression tracking in [shared/wiseup-schema.ts](/workspace/shared/wiseup-schema.ts), [server/wiseup.ts](/workspace/server/wiseup.ts), and [server/routes/v1.ts](/workspace/server/routes/v1.ts).
- Ingestion is not limited to a single active spider.
  Active spiders exist for Gumtree, Job Mail, and Bizcommunity in [scrapy_jobs/scrapy_jobs/spiders](/workspace/scrapy_jobs/scrapy_jobs/spiders).
- Compliance is not absent.
  POPIA-style sanitization is already present in [scrapy_jobs/scrapy_jobs/middleware/compliance_middleware.py](/workspace/scrapy_jobs/scrapy_jobs/middleware/compliance_middleware.py).
- De-duplication is not absent.
  Fingerprint-based ingest dedup already exists in [server/services/jobIngestionService.ts](/workspace/server/services/jobIngestionService.ts).
- Bookmarks are not purely mock-backed anymore.
  Job favorites and WiseUp bookmarks are backed by server routes in [server/routes/jobFavorites.ts](/workspace/server/routes/jobFavorites.ts) and [server/routes/v1.ts](/workspace/server/routes/v1.ts).

## Verified Missing Or Incomplete Pieces

These are the gaps worth scaffolding now because they still lack a canonical implementation path:

1. Monetization runtime:
   no provider-agnostic ad-slot inventory API, no generic ad event contract, no reusable frontend ad slot component for non-WiseUp surfaces
2. SMS delivery:
   settings exist, but there was no service boundary for an SMS provider and no API entry point to exercise it
3. Offline support:
   manifest existed, but no service-worker registration or cache strategy was wired into the main frontend
4. Scraper governance:
   compliance exists, but there was no legal/source registry used to explicitly gate spider execution
5. Operational orchestration:
   the scraping orchestrator is still local CLI driven rather than scheduled and policy aware

## Scaffolding Added In This Pass

To turn the audit into executable groundwork, this pass adds:

- provider-agnostic monetization contracts in [shared/monetization.ts](/workspace/shared/monetization.ts)
- a lightweight monetization API in [server/routes/monetization.ts](/workspace/server/routes/monetization.ts)
- a reusable frontend ad slot in [client/src/components/ads/AdSlot.tsx](/workspace/client/src/components/ads/AdSlot.tsx)
- service-worker registration in [client/src/lib/registerServiceWorker.ts](/workspace/client/src/lib/registerServiceWorker.ts) and [client/public/sw.js](/workspace/client/public/sw.js)
- an SMS service boundary in [server/services/smsService.ts](/workspace/server/services/smsService.ts)
- an SMS scaffolding route in [server/routes/notificationChannels.ts](/workspace/server/routes/notificationChannels.ts)
- a legal source registry in [scrapy_jobs/config/source-registry.json](/workspace/scrapy_jobs/config/source-registry.json)
- scraper gating helpers in [scrapy_jobs/scrapy_jobs/legal_registry.py](/workspace/scrapy_jobs/scrapy_jobs/legal_registry.py)

## Next Buildable Steps

1. Persist ad analytics events and advertiser reporting instead of only logging them.
2. Pick an SMS provider and implement the transport inside [server/services/smsService.ts](/workspace/server/services/smsService.ts).
3. Expand the service worker from static-shell caching to route-level offline fallbacks for jobs and CV editing.
4. Enforce the source registry in CI or scheduled orchestration, not only in local scraper execution.
5. Replace fingerprint-only dedup with cross-source entity resolution using normalized company and location confidence scoring.
