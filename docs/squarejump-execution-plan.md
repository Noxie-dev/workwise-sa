# SquareJUMP Execution Plan

## Outcome

Move SquareJUMP from a production-oriented foundation to a controlled pilot, then to production readiness, without changing the existing numeric job primary key or breaking current job, application, analytics, and API contracts.

The plan is deliberately ordered around trust and correctness first:

```text
Data integrity → safety → policy control → matching quality → release delivery → measurement → scale
```

## Current baseline

The repository already provides:

- opaque JUIDs and public job references;
- source-registry checks;
- deterministic taxonomy and requirement extraction;
- separate Opportunity, Match, and Placement score functions;
- release-event persistence and a dedicated worker;
- authenticated recommendation and exposure-token event APIs;
- focused unit tests and PostgreSQL/SQLite migration infrastructure.

The following are not yet production-complete: cross-source canonical deduplication, live policy-driven scoring, real subscriber release behavior, notification delivery, measured engagement features, geospatial matching, and production-shaped operational testing.

## Phase P0 — Protect data and establish release gates

### P0.1 Make rollout controls fail closed

Files: `server/services/featureFlagService.ts`, route registration, deployment configuration.

- Default `ENABLE_SQUAREJUMP`, `ENABLE_SQUAREJUMP_RELEASES`, and notification flags to disabled when configuration cannot be read.
- Define explicit development, staging, and production flag values.
- Add a startup report showing effective flags and database dialect.
- Ensure disabled SquareJUMP routes return a stable, intentional response.

Done when a configuration/database failure cannot silently enable the new ranking or release system.

### P0.2 Rehearse the PostgreSQL migration

Files: `migrations/0013_add_squarejump_foundations.sql`, `server/utils/sqlMigrations.ts`, migration tests, deployment runbook.

- Run the full migration sequence against a disposable Neon branch from an empty database.
- Run it against a production-shaped snapshot with existing foreign keys and data.
- Verify rollback/restore procedure and migration idempotency.
- Add automated PostgreSQL smoke coverage for the normalized SQL, table creation, indexes, and backfill.
- Record the Neon branch, timestamp, result, and rollback evidence in the release checklist.

Done when a clean Neon migration and a representative existing-data migration both pass without manual SQL edits.

### P0.3 Add an end-to-end ingest transaction boundary

Files: `server/services/jobIngestionService.ts`, `server/services/squarejump/squareJumpRepository.ts`, storage transaction helpers.

- Make canonical job creation, source occurrence, classification, requirements, score, and release records commit atomically.
- Ensure a failed artifact write cannot leave an orphan job, company, category, or release event.
- Make retries idempotent using source/external ID plus payload hash.

Done when a forced failure at every persistence step leaves no partial canonical record and a retry produces one result.

## Phase P1 — Complete identity and deduplication

### P1.1 Separate exact, content, and cross-source identity evidence

Files: `server/services/squarejump/deduplicationService.ts`, source-record schema.

- Keep source/external ID as a source-occurrence key, not the cross-source exact fingerprint.
- Build stable exact evidence from normalized employer identity and canonical application URL.
- Add content shingles/fingerprint and a semantic-fingerprint extension point.
- Store `vacancy_group_id`, `repost_of_job_id`, and `canonical_job_id` or an equivalent relationship model.

### P1.2 Make duplicate decisions operational

Files: `server/services/jobIngestionService.ts`, duplicate repository/service, admin routes/UI.

- Use `calculateDuplicateConfidence` and `duplicateAction` in the ingest path.
- Auto-merge only high-confidence duplicates with corroborating evidence.
- Queue medium-confidence candidates for review rather than creating indistinguishable live duplicates.
- Preserve every source occurrence and update `last_seen_at`, payload hashes, and source metadata on repeat ingest.
- Add authenticated admin review, merge, split, and audit operations.

Done when the same vacancy from two approved sources resolves to one canonical job, while branch vacancies and legitimate reposts remain separate.

### P1.3 Add identity and deduplication integration tests

- Same source + same external ID is idempotent.
- Same job + different tracking parameters is deduplicated.
- Same employer/title/content across two sources enters the expected merge path.
- Similar but distinct branch vacancies are not merged.
- A corrected classification does not change the JUID.

## Phase P2 — Make scoring policy real and auditable

### P2.1 Wire active policies into all score calculations

Files: `opportunityScoringService.ts`, `matchScoringService.ts`, `placementService.ts`, `scorePolicyRepository.ts`, recommendation service.

- Load the active policy by score type.
- Validate the policy schema per score type, not only that arbitrary weights total 100.
- Pass policy weights and thresholds into pure scoring functions.
- Persist the exact policy version and feature snapshot used for every calculation.
- Reject activation when required components are missing, thresholds are invalid, or more than one active policy would result.

Done when activating a new policy changes a controlled calculation and recommendations expose the policy actually used.

### P2.2 Build real policy simulation and rollback

- Replay a candidate policy against a sampled job set and report before/after score distributions, rank changes, quarantine changes, and affected counts.
- Add staged activation and explicit rollback to the previous immutable version.
- Keep an audit record containing actor, input policy, sample definition, results, and activation outcome.
- Add admin authorization tests for simulation, activation, and rollback.

### P2.3 Replace placeholder score features

- Add explicit feature status: observed, estimated, or unavailable.
- Initially use conservative neutral values only when unavailable, and expose that fact internally.
- Add application-link verification, expiry checks, source reliability aggregates, employer verification, and report-rate inputs.
- Never label ingestion time as verification time unless verification actually occurred.

## Phase P3 — Improve matching and ranking correctness

### P3.1 Normalize job location, occupation, and skills

Files: ingestion contract, taxonomy/location services, `jobIngestionService.ts`, schema.

- Populate province, municipality, city/location codes, occupation code, and work mode consistently.
- Add a canonical location resolver with confidence and fallback behavior.
- Extract normalized skills separately from formal requirements.
- Store source and classifier provenance for each normalized field.

### P3.2 Implement real distance-aware matching

- Add coordinates or a deliberately versioned location-distance service.
- Use exact location, travel radius, remote/hybrid mode, and province fallback in that order.
- Pass distance into `calculateMatchScore` instead of leaving it neutral.
- Explain approximate distance honestly; do not imply commute time.

### P3.3 Make candidate retrieval scalable and stable

Files: `squareJumpRecommendationService.ts`, schema indexes.

- Move filtering into PostgreSQL rather than loading only the newest 500 jobs.
- Add stable tie-breaking by score, freshness, and JUID.
- Replace offset cursors with a signed cursor containing the ordering tuple and policy version.
- Add pagination tests while new jobs are inserted concurrently.

Done when an eligible older job can be recommended, pages do not duplicate/skip records, and query time remains bounded on a production-shaped dataset.

## Phase P4 — Activate release eligibility and notifications

### P4.1 Implement release policy inputs

Files: `jobIngestionService.ts`, `releasePolicyService.ts`, source/link verification services.

- Supply real expiry/closing-date data when available.
- Determine early-access eligibility from quality threshold, local category/location calibration, link health, and risk status.
- Implement the standard subscriber/member/public windows and urgent-job exceptions.
- Enforce `ENABLE_SQUAREJUMP_RELEASES` in release scheduling and visibility decisions.

Done when an eligible job has distinct release timestamps and an urgent job bypasses excessive delay.

### P4.2 Make the worker deliver a durable outcome

Files: `server/services/squarejump/releaseWorker.ts`, `server/workers/`, notification services.

- Keep conditional claims, stale-lock recovery, retry backoff, and dead-letter handling.
- Make the handler perform the actual release-side effects: eligible audience state, in-app notification creation, and notification dispatch enqueueing.
- Ensure two workers cannot publish or notify twice.
- Add worker health, queue depth, retry, and dead-letter metrics.

### P4.3 Implement consented notification delivery

- Add notification delivery records keyed by user, canonical job, channel, reason, and release stage.
- Enforce channel consent, frequency caps, digest modes, unsubscribe, provider retry, and provider failure handling.
- Test email/WhatsApp providers behind an adapter; keep in-app delivery available without external providers.

## Phase P5 — Instrument trustworthy learning signals

### P5.1 Harden event quality

Files: `server/routes/squareJump.ts`, event service, rate limiting, schema.

- Add exposure-token expiry and event time-window checks.
- Enforce dwell requirements for qualified views.
- Add event rate limits, duplicate windows, bot/anomaly signals, and report abuse controls.
- Keep raw events append-only where practical.

### P5.2 Add aggregates before behavioural ranking

- Create exposure-normalized aggregates by category, location, age band, position, device, and acquisition source.
- Add application funnel aggregates and source/employer quality aggregates.
- Do not enable behavioural ranking until aggregate correctness and minimum sample thresholds are proven.

Done when an offline report can explain whether a job’s engagement is strong after exposure and position correction.

## Phase P6 — Pilot, measure, and scale

### P6.1 Controlled pilot

- Run with a limited source set and an internal/staging audience.
- Keep semantic, behavioural, subscriber-release, and external notification flags independently controllable.
- Monitor ingest failures, duplicate rate, quarantine rate, score drift, recommendation latency, exposure volume, event quality, and notification failures.
- Review false positives/negatives in classification and mandatory-requirement matching.

### P6.2 Production acceptance gates

The pilot cannot graduate until all of these are evidenced:

- clean Neon migration and restore rehearsal;
- idempotent cross-source deduplication;
- active policy simulation, activation, and rollback;
- stable paginated recommendations on production-shaped volume;
- real release-worker concurrency tests;
- link verification and expiry behavior;
- explicit notification consent and unsubscribe tests;
- exposure-normalized analytics;
- audit logs and operational alerts;
- POPIA, source licensing, and fairness review.

### P6.3 Deferred capabilities

Keep embeddings, pgvector, collaborative filtering, learning-to-rank, and contextual bandits disabled until the platform has sufficient clean interaction data, offline evaluation, fairness monitoring, cost controls, and rollback procedures.

## Suggested delivery order

1. P0.1–P0.3: rollout safety, Neon migration, atomic ingest.
2. P1.1–P1.3: canonical identity and deduplication.
3. P2.1–P2.3: live policy control and measured scoring.
4. P3.1–P3.3: structured matching and scalable retrieval.
5. P4.1–P4.3: release windows and notifications.
6. P5.1–P5.2: event quality and aggregates.
7. P6: controlled pilot and production acceptance.

## Definition of success

SquareJUMP is ready for broad production when it can answer, with stored evidence:

> Why was this job accepted, matched, ranked, released to this audience, notified to this user, and later promoted or demoted?

The answer must be reproducible from the canonical JUID, source records, policy version, feature snapshot, release event, exposure token, and audit history.
