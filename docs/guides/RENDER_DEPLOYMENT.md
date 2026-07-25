# Render Deployment Guide

This repo now has a Render blueprint at [render.yaml](/workspace/render.yaml) for the canonical Express runtime.

## What Render Deploys

- Web service: the root Express app built from [server/server/index.ts](/workspace/server/server/index.ts)
- Build artifact: `dist/index.js`
- Static assets: `dist/public`
- Database: managed PostgreSQL provisioned from the blueprint
- Upload storage: persistent disk mounted at `/opt/render/project/src/uploads`

## Blueprint Commands

- Build: `pnpm install --frozen-lockfile && pnpm build`
- Start: `pnpm start`

## Required Environment

The blueprint wires the database and the base app flags. Add the remaining secrets in the Render dashboard.

### Required for production

- `NODE_ENV=production`
- `DATABASE_URL` from the Render PostgreSQL service
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `GOOGLE_GENAI_API_KEY`
- `SESSION_SECRET`

### Commonly needed

- `ANTHROPIC_API_KEY`
- `SCRAPING_INGEST_TOKEN`
- `GOOGLE_APPLICATION_CREDENTIALS` or workload identity setup for Firebase Admin access
- `FILE_SERVE_URL` if you want a fixed public base URL for uploads
- `PUBLIC_BASE_URL` if billing or callback links should use a custom domain

### Frontend flags

- `VITE_API_URL=/api`
- `VITE_USE_FIREBASE_EMULATORS=false`
- `VITE_USE_MOCK_PUBLIC_DATA=false`

## File URLs

If `FILE_SERVE_URL` is not set, the backend now falls back to `RENDER_EXTERNAL_URL` on Render so upload URLs resolve against the deployed service instead of `localhost`.

## Notes

- Render injects `PORT`; do not hardcode a conflicting value in the blueprint.
- PostgreSQL is required for the primary production path. SQLite remains a local/test fallback only.
- If you use a custom domain, set `FILE_SERVE_URL` and `PUBLIC_BASE_URL` to that domain so generated links stay stable.
