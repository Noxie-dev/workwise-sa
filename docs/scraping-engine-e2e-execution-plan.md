# Scraping Engine E2E Execution Plan

## Objective

Execute the scraping-engine hardening recommendations back-to-back, from runtime stabilization through production-grade orchestration, ingestion, compliance, observability, and final end-to-end validation.

This plan is intentionally sequential. Each phase has an exit gate that must pass before the next phase starts, so failures are caught close to the change that introduced them.

## Current Baseline

Primary files:

- `scrapy_jobs/run_scrapers.py`
- `scrapy_jobs/scrapy_jobs/settings.py`
- `scrapy_jobs/scrapy_jobs/pipelines.py`
- `scrapy_jobs/scrapy_jobs/middleware/compliance_middleware.py`
- `scrapy_jobs/scrapy_jobs/utils/normalizer.py`
- `scrapy_jobs/scrapy_jobs/spiders/*_spider.py`
- `scrapy_jobs/config/source-registry.json`
- `server/routes/scraping.ts`
- `server/routes/v1.ts`
- `server/services/jobIngestionService.ts`
- `server/storage.ts`
- `shared/job-ingest-schema.ts`
- `shared/schema.ts`

Known baseline risks:

- `run_scrapers.py` shells out to plain `scrapy`.
- The scraping API accepts options that are not fully passed to the Python orchestrator.
- API cancellation does not stop the scraper process.
- Scraping session state is in memory.
- Result loading chooses the newest report instead of a run-specific report.
- Ingestion writes are not transactional.
- Raw artifacts may retain personal data.
- Scraper Python test execution requires explicit package path setup.

## Phase 0: Baseline Stabilization

Goal: make the current scraper runnable and testable in a repeatable way before functional changes.

Actions:

1. Pin the supported Python runtime in docs and CI. Prefer Python 3.12 until Scrapy/Twisted compatibility is verified for newer versions.
2. Add a scraper test command that always sets the package path correctly.
3. Replace shell dependency on `scrapy` with `sys.executable -m scrapy` or an explicit `SCRAPY_BIN` fallback.
4. Fix `setup_scrapy.sh` so it uses supported flags only.
5. Add `.env.example` entries for:
   - `WORKWISE_API_BASE_URL`
   - `SCRAPING_INGEST_TOKEN`
   - optional `SCRAPY_SETTINGS_MODULE`

Exit gate:

```bash
cd scrapy_jobs
PYTHONPATH="$PWD" ./venv/bin/pytest tests -q
./venv/bin/python -m scrapy list
./venv/bin/python run_scrapers.py --source=gumtree --max-items 1
```

Expected result: tests pass, Scrapy lists all spiders, and a one-item dry/smoke run either completes or fails with a source-specific crawl error, not a local runtime/import error.

## Phase 1: API Contract Alignment

Goal: make `/api/scraping/trigger` accurately control the Python orchestrator.

Actions:

1. Pass `maxItems` from `server/routes/scraping.ts` to `run_scrapers.py`.
2. Decide and implement one of:
   - remove `dryRun` from the API, or
   - add `--dry-run` support to `run_scrapers.py` that scrapes and writes artifacts without ingesting.
3. Normalize source selection:
   - prefer `source` as the public API field, or
   - make `spiders` map safely to known sources.
4. Reject unknown sources at the API layer using the same registry semantics as the Python orchestrator.
5. Add unit tests for all trigger options.

Exit gate:

```bash
pnpm run test:server -- --run server/tests/unit
```

Expected result: trigger API tests prove `source`, `maxItems`, `concurrent`, `ingest`, and optional `dryRun` map to the intended Python command.

## Phase 2: Durable Run Model

Goal: replace in-memory-only orchestration with durable run records.

Actions:

1. Add a `scraping_runs` table with:
   - `id`
   - `source`
   - `status`
   - `pid`
   - `startedAt`
   - `finishedAt`
   - `requestedBy`
   - `options`
   - `artifactRoot`
   - `reportPath`
   - `itemsScraped`
   - `itemsRejected`
   - `itemsInserted`
   - `duplicates`
   - `errors`
2. Add storage methods for creating, updating, listing, and loading runs.
3. Keep the current in-memory map only as a process cache, not source of truth.
4. Update `/status`, `/session/:id`, `/logs/:id`, and `/stats` to read durable run records.

Exit gate:

```bash
pnpm run db:generate
pnpm run db:migrate:test
pnpm run test:server -- --run server/tests/unit
```

Expected result: run state survives process restarts in test/dev storage.

## Phase 3: Run-Scoped Artifacts

Goal: ensure every report, raw artifact, normalized artifact, retry payload, and log entry belongs to a specific run.

Actions:

1. Add `--run-id` to `run_scrapers.py`.
2. Write artifacts under `scrapy_jobs/output/runs/{runId}/`.
3. Write:
   - `raw/{spider}.jsonl`
   - `normalized/{spider}.jsonl`
   - `retry/{spider}_{timestamp}.json`
   - `report.json`
4. Update `loadScrapingResults` to load `reportPath` for the requested run only.
5. Prefer JSONL for large artifacts to avoid whole-run memory pressure.

Exit gate:

```bash
cd scrapy_jobs
PYTHONPATH="$PWD" ./venv/bin/pytest tests -q
./venv/bin/python run_scrapers.py --source=gumtree --max-items 1 --run-id local-smoke
test -f output/runs/local-smoke/report.json
```

Expected result: no report is inferred by newest timestamp.

## Phase 4: Real Cancellation And Process Safety

Goal: make cancellation stop the actual scrape and cleanly persist final state.

Actions:

1. Store spawned process handles by run ID in the Node process cache.
2. Persist `pid` to `scraping_runs`.
3. On cancel:
   - mark run `cancelling`
   - send SIGTERM
   - wait briefly
   - send SIGKILL if still alive
   - mark `cancelled`
4. Ensure process `close` handlers do not overwrite `cancelled` with `failed`.
5. Add tests for cancel-before-complete behavior.

Exit gate:

```bash
pnpm run test:server -- --run server/tests/unit
```

Manual smoke:

```bash
curl -X POST http://localhost:3001/api/scraping/trigger \
  -H 'Content-Type: application/json' \
  -d '{"source":"gumtree","maxItems":1000}'

curl -X POST http://localhost:3001/api/scraping/cancel/{sessionId}
```

Expected result: the child process exits and the persisted run ends as `cancelled`.

## Phase 5: Transactional And Idempotent Ingestion

Goal: prevent duplicate or orphaned jobs during ingestion.

Actions:

1. Move job creation plus ingest-record creation into a DB transaction.
2. Make source ID idempotency primary:
   - unique `(sourceSite, externalId)`
3. Rework fingerprinting:
   - canonical title
   - canonical company
   - canonical location
   - source URL or canonical apply URL
   - description hash
   - posted date bucket where available
4. Treat fingerprint matches as reviewable duplicates, not always automatic skips.
5. Chunk ingestion payloads to the API limit of 500.
6. Return a richer summary:
   - inserted
   - updated
   - duplicateSource
   - duplicateFingerprint
   - failed
   - rejected
   - errors

Exit gate:

```bash
pnpm run test:server -- --run server/tests/unit/jobIngestRoutes.test.ts
pnpm run test:server -- --run server/tests/unit
```

Expected result: retrying the same batch is safe and does not create extra jobs.

## Phase 6: Compliance And Data Retention

Goal: reduce privacy and legal exposure while keeping useful debugging artifacts.

Actions:

1. Redact contact information before writing raw artifacts, or split raw artifacts into restricted short-retention storage.
2. Add `scrapedAt`, `sourceRobotsCheckedAt`, and `registryApprovalStatus` to metadata.
3. Validate source registry recency before production ingest.
4. Add configurable retention:
   - raw artifacts: short retention
   - normalized artifacts: longer retention
   - reports: long retention
5. Require `SCRAPING_INGEST_TOKEN` outside local development.

Exit gate:

```bash
cd scrapy_jobs
PYTHONPATH="$PWD" ./venv/bin/pytest tests -q
```

Expected result: tests prove redaction happens before artifact persistence and ingestion rejects missing tokens in production-like mode.

## Phase 7: Data Quality Expansion

Goal: make scraped jobs more useful and easier to monitor.

Actions:

1. Extend normalized metadata with extraction confidence.
2. Add salary parsing:
   - `salaryMin`
   - `salaryMax`
   - `salaryCurrency`
   - `salaryPeriod`
3. Add location parsing:
   - `city`
   - `province`
   - `country`
4. Add category classification with confidence.
5. Keep original `salaryText` and `location` for display compatibility.
6. Add fixture-based tests for every spider using saved HTML samples.

Exit gate:

```bash
cd scrapy_jobs
PYTHONPATH="$PWD" ./venv/bin/pytest tests -q
```

Expected result: every source has fixture coverage for listing extraction, detail extraction, normalization, and compliance.

## Phase 8: Observability And Alerting

Goal: know when the scraper is healthy, degraded, or silently broken.

Actions:

1. Record per-run metrics:
   - HTTP status counts
   - request retries
   - response latency
   - links discovered
   - detail pages visited
   - items normalized
   - compliance rejects
   - ingest duplicates
   - ingest failures
2. Add zero-result alerts by source.
3. Add high-rejection-rate alerts by source.
4. Add selector-break alerts when listing pages return no links.
5. Expose a run summary endpoint for dashboards.

Exit gate:

```bash
pnpm run test:server -- --run server/tests/unit
```

Manual smoke:

```bash
curl http://localhost:3001/api/scraping/stats
curl http://localhost:3001/api/scraping/session/{sessionId}
```

Expected result: operators can determine whether failure is network, selector, compliance, or ingest related.

## Phase 9: Full Back-To-Back E2E Validation

Goal: prove the full pipeline works from trigger to persisted jobs.

Prerequisites:

- Backend running on `WORKWISE_API_BASE_URL`.
- Test database migrated.
- `SCRAPING_INGEST_TOKEN` configured in both backend and scraper environment.
- Source registry allows the target source to ingest.

Execution:

```bash
pnpm run db:migrate:test
pnpm run test:server -- --run server/tests/unit

cd scrapy_jobs
PYTHONPATH="$PWD" ./venv/bin/pytest tests -q
./venv/bin/python -m scrapy list

WORKWISE_API_BASE_URL=http://localhost:3001 \
SCRAPING_INGEST_TOKEN="$SCRAPING_INGEST_TOKEN" \
./venv/bin/python run_scrapers.py \
  --source=gumtree \
  --max-items=10 \
  --ingest=true \
  --run-id=e2e-local-gumtree
```

API-driven execution:

```bash
curl -X POST http://localhost:3001/api/scraping/trigger \
  -H 'Content-Type: application/json' \
  -d '{"source":"gumtree","maxItems":10,"concurrent":1,"ingest":true}'

curl http://localhost:3001/api/scraping/session/{sessionId}
curl http://localhost:3001/api/scraping/stats
curl http://localhost:3001/api/v1/jobs
```

Pass criteria:

- Run status is `completed`.
- Report belongs to the requested run ID.
- Normalized artifacts exist.
- Compliance rejects are visible and explainable.
- Ingest summary is persisted.
- Retrying the same run or same payload creates no duplicate jobs.
- `/api/v1/jobs` includes newly ingested jobs or reports them as expected duplicates.
- No raw artifact exposes unredacted email addresses or phone numbers.

## Suggested Delivery Order

Recommended implementation order:

1. Phase 0: runtime and test stabilization.
2. Phase 1: API contract alignment.
3. Phase 3: run-scoped artifacts.
4. Phase 5: transactional ingestion.
5. Phase 2: durable run model.
6. Phase 4: cancellation.
7. Phase 6: compliance and retention.
8. Phase 7: data quality.
9. Phase 8: observability.
10. Phase 9: final E2E validation.

The order intentionally fixes local reproducibility first, then correctness of inputs/outputs, then durability and operational features. That gives each later phase a stable base to stand on.

## Definition Of Done

The scraping engine is considered hardened when:

- A new developer can run scraper tests and one spider smoke test from documented commands.
- API-triggered runs, direct CLI runs, and retries all produce run-scoped artifacts.
- Scrape cancellation stops the real child process.
- Ingestion is idempotent and transactional.
- Compliance redaction happens before long-lived persistence.
- Source health and ingest health are visible from API responses and logs.
- The final Phase 9 flow passes back-to-back without manual cleanup.
