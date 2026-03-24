# Database Strategy

## Canonical Policy

- PostgreSQL is the canonical production database.
- SQLite is supported only for local development and automated tests.
- New product features should target PostgreSQL semantics first.
- SQLite compatibility is a convenience path, not a reason to weaken production data guarantees.

## Practical Rules

- Any production deployment must provide `DATABASE_URL` for PostgreSQL.
- Local and test workflows may continue to use `sqlite:./test.db`.
- Migrations must be written so they are safe for both current development SQLite usage and canonical PostgreSQL usage where practical.
- Shared schema definitions should describe the production contract; migration SQL is the source of truth for backfilling existing databases.

## Index Policy

The following access patterns are important enough to require explicit indexes:

- `job_applications (user_id, job_id)` because the product enforces one application per user per job
- `job_applications (job_id, status)` for employer review views
- `jobs (created_at)` for newest-job queries
- `user_interactions (job_id, interaction_time)` for dashboard and employer analytics
- `user_notifications (user_id, is_read, created_at)` for inbox/unread queries

## Current Decision

SQLite remains dev/test only.

That means:

- we do not need to preserve feature parity for every PostgreSQL optimization
- we do need stable migrations and schema contracts so local development still works
- future operational hardening should assume PostgreSQL monitoring, backups, and performance tuning
