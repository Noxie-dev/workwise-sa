# Deployment Strategy

## Canonical Production Path

WorkWise SA now treats the bundled Express application as the only canonical production runtime.

- frontend artifact: `dist/public`
- backend artifact: `dist/index.js`
- build command: `pnpm run build`
- runtime command: `pnpm run start`
- deployment validation command: `pnpm run deploy:prod`

This means the production contract is:

1. build the root workspace
2. provide a production PostgreSQL `DATABASE_URL`
3. provide Firebase credentials/config for auth and admin operations
4. provide AI and other provider secrets required by enabled features
5. run the bundled Node server

## Legacy Runtime Surfaces

These remain in the repo but are not first-class production targets:

- `functions/`
- `netlify/functions/`
- `firebase.json`
- `netlify.toml`

They are retained for compatibility, migration support, and historical operational context. They should not define the default developer workflow or the primary architecture narrative.

## Supported Environment Modes

### Local development

- frontend via Vite
- backend via `tsx` watch mode
- SQLite allowed for local dev/test
- Firebase emulators optional

### Primary production

- bundled Express runtime from `dist/index.js`
- PostgreSQL required
- `VITE_USE_FIREBASE_EMULATORS=false`
- mock public data disabled

## Environment Contract

Required for primary production:

- `NODE_ENV=production`
- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- one valid Firebase Admin credential path or workload identity setup
- `GOOGLE_GENAI_API_KEY` if AI features are enabled

Recommended for stable production operation:

- `PORT`
- `FILE_SERVE_URL`
- `UPLOAD_DIR`
- `REDIS_URL`
- `SCRAPING_INGEST_TOKEN`
- all `VITE_FIREBASE_*` client auth settings
- `VITE_API_URL=/api`

Must not remain enabled in primary production:

- `VITE_USE_FIREBASE_EMULATORS=true`
- `VITE_USE_MOCK_PUBLIC_DATA=true`
- SQLite `DATABASE_URL`

## Operational Commands

Primary:

```bash
pnpm run env:check-prod
pnpm run build
pnpm run start
pnpm run deploy:prod
```

Legacy:

```bash
pnpm run deploy:legacy:netlify
pnpm run deploy:legacy:firebase:hosting
pnpm run deploy:legacy:firebase:functions
pnpm run deploy:legacy:firebase:all
```
