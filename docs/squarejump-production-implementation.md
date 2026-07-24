# SquareJUMP production implementation

SquareJUMP is implemented in the canonical Express/Drizzle backend under
`server/`. The implementation preserves existing integer primary and foreign
keys while adding an opaque, immutable business identity and versioned ranking
data.

## Delivered foundation

- `jobs.juid` is an opaque, time-sortable `juid_sq_...` identifier. Existing
  jobs are backfilled and PostgreSQL enforces `NOT NULL` and uniqueness.
- `public_job_ref` is a separate support/display reference and is never parsed
  for matching.
- Every new source occurrence is stored in `job_source_records`; the legacy
  ingest table remains readable for rollout compatibility.
- Node enforces the checked-in source registry before canonical persistence.
- Exact, content, and normalised-payload fingerprints are independent.
  Ambiguous content matches create review candidates rather than auto-merging.
- Deterministic taxonomy and requirement rules run synchronously. No AI
  provider is on the ingestion critical path.
- Opportunity, Match, and Placement scores are separate and explainable.
  Opportunity scores have current and append-only history records.
- Mandatory requirements cap Match Score. Unknown or inferred requirements do
  not exclude candidates.
- Subscriber/member/public release timestamps are eligibility gates, not score
  bonuses.
- Urgent jobs receive shorter or zero exclusive windows.
- Release work is persisted, conditionally claimed, retried, and dead-lettered
  by a dedicated worker.
- Public list, search, detail, and application routes enforce their correct
  audience release timestamp.
- Recommendation events require an authenticated user and a valid exposure
  token, which makes exposure-normalised analytics possible.
- Recommendation pages persist user matches for release-time notification
  eligibility, and in-app release notifications use durable dedupe records.
- Policy simulation, activation, and job rescoring are admin-only and audited.
- Notification channel consent and delivery mode are recorded per user.
- External email and WhatsApp delivery remain adapter/provider work; the current
  release worker provides retry-safe in-app delivery only.
- The old recommendation routers that trusted client-supplied `userId` values
  are no longer mounted.

## Canonical API

| Method | Path                                              | Access                           |
| ------ | ------------------------------------------------- | -------------------------------- |
| `POST` | `/api/v1/jobs/ingest`                             | Ingest token and approved source |
| `GET`  | `/api/v1/jobs/recommendations`                    | Authenticated                    |
| `PUT`  | `/api/v1/jobs/match-profile`                      | Authenticated                    |
| `POST` | `/api/v1/job-events`                              | Authenticated + exposure token   |
| `GET`  | `/api/v1/notification-consents`                   | Authenticated                    |
| `PUT`  | `/api/v1/notification-consents/:channel`          | Authenticated                    |
| `POST` | `/api/v1/admin/squarejump/jobs/:juid/recalculate` | Admin                            |
| `GET`  | `/api/v1/admin/squarejump/duplicates`              | Admin                            |
| `POST` | `/api/v1/admin/squarejump/duplicates/:id/resolve`  | Admin                            |
| `POST` | `/api/v1/admin/squarejump/policies/simulate`      | Admin                            |
| `POST` | `/api/v1/admin/squarejump/policies/:id/activate`  | Admin                            |
| `POST` | `/api/v1/admin/squarejump/policies/:id/rollback`  | Admin                            |

Recommendation responses contain the job, Opportunity Score, Match Score,
Placement Score, user-facing reasons, missing requirements, release state, and
an opaque tracking token.
Recommendation cursors are signed and bound to the active policy versions and
the deterministic placement/date/JUID ordering tuple.

Duplicate candidates can be reviewed through the admin list and resolution
endpoints. Merge decisions re-point source occurrences to the selected
canonical job, mark the duplicate job inactive, and write an audit event.

## Deployment

Apply the schema before deploying the API:

```text
pnpm run db:migrate
```

`pnpm run db:generate` writes Drizzle's schema output to the ignored
`.drizzle-generated/` review directory. It must not be copied into the
canonical `migrations/` history without review because the repository uses a
hand-authored raw SQL migration journal.

Run the release worker as a separate process:

```text
pnpm run worker:squarejump
```

Refresh materialized user/job placement rows as a separate batch worker:

```text
pnpm run worker:squarejump:matches
```

The recommendation API reads materialized matches with signed database
keyset cursors. It falls back to the legacy bounded scorer only while a user
has no materialized rows.
Set `SQUAREJUMP_MATERIALIZED_FEED=false` only for emergency rollback to the
legacy request-time scorer.

The worker poll interval is configured with
`SQUAREJUMP_RELEASE_POLL_MS` (default: 5000 ms). Its persisted idempotency keys,
conditional claims, stale-claim recovery, retry count, and dead-letter state
make process restarts safe.

The source registry defaults to
`scrapy_jobs/config/source-registry.json`. Override the path with
`SQUAREJUMP_SOURCE_REGISTRY` only when deployment packaging requires it.

## Feature flags

- `ENABLE_SQUAREJUMP=true`
- `ENABLE_SQUAREJUMP_RELEASES=true`
- `ENABLE_SQUAREJUMP_SEMANTIC=false`
- `ENABLE_SQUAREJUMP_BEHAVIOURAL=false`

Semantic embeddings and behavioural learning remain off by default. They are
later rollout phases and must not become ingestion dependencies.

## Operational gates still requiring environment evidence

Code cannot by itself prove production data or vendor readiness. Before broad
release, operations must still provide:

- PostgreSQL migration and rollback rehearsal on a production-shaped snapshot;
- a managed worker deployment with health/queue alerts;
- source-registry legal review dates and licensed-source evidence;
- application-link verification and expiry workers;
- email and consented WhatsApp providers with unsubscribe tests;
- category/location benchmark data for exposure-normalised engagement;
- fairness dashboards and South African legal review;
- A/B experiment ownership and minimum sample-size rules.

Collaborative filtering, embeddings/pgvector, learning-to-rank, and contextual
bandits are intentionally not enabled. Their acceptance conditions require
interaction density, bot controls, offline evaluation, fairness monitoring,
guardrails, and rollback evidence.
