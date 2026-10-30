# Neon database setup

Project: round-bread-20939545. Organization: org-cool-violet-56938851. Branch: production.

Run `neon deploy` to reconcile neon.ts and pull database credentials. Local shell variables take precedence, followed by .env.local, then .env. Both files and the local .neon link are ignored by Git. Set DATABASE_URL in the hosting provider's secrets when deploying the Express server; local environment files are not uploaded automatically.

The Express runtime retains Drizzle and postgres.js with DATABASE_URL (pooled). Drizzle schema operations use DATABASE_URL_UNPOOLED (direct). `pnpm exec drizzle-kit push` reconciles shared/schema.ts; inspect the plan before accepting changes against a populated database. The initial setup applied the schema to an empty database.

Neon supplies Postgres only. Firebase authentication and existing file storage remain separate services. No records from the inaccessible previous Neon account were migrated.

Verification: started Express on port 3107, inserted a temporary category through Postgres, retrieved it through GET /api/categories/:slug, updated it through Postgres, and confirmed the update through the HTTP API. Removed the temporary category afterward.

Validation output:

- `neon deploy`: No changes — branch production already matches the policy; utilized services: Postgres.
- `drizzle-kit push --force` against verified-empty database: Changes applied.
- `npm run build`: frontend built in 55.46s; backend dist/index.js built in 157ms; exit 0.
- `pnpm run type-check` and `pnpm run lint`: exit 0.
- `pnpm run test:server`: 17 files passed, 62 tests passed.
- Source runtime: SQL insert -> Express GET -> HTTP 200; update reflected through API; verification data removed.
- Built runtime: GET /api/categories/:slug returned the matching Neon record with HTTP 200; verification data removed.

Initial build failed with ENOSPC; clearing npm's disposable download cache allowed the retry to pass. Redis was unavailable locally and the app used its fallback. The built runtime also reported Firebase initialization failure and continued; authenticated Firebase flows were not verified. This setup verifies Postgres and public database-backed routes, not Firebase authentication or a remote hosting rollout.
