# Environment Verification Matrix

This matrix records what the repo currently supports, what is verified by local checks, and what still requires real deployment credentials.

## Supported Runtime Modes

### Local development

- status: supported
- database: SQLite allowed
- frontend: Vite with `/api` proxy to Express
- auth: Firebase client config required, or emulators enabled
- file storage: local filesystem under `UPLOAD_DIR`
- AI: optional
- Redis: optional
- SMS: scaffold only

### Primary production

- status: supported
- database: PostgreSQL required
- backend: bundled Express app from `dist/index.js`
- frontend assets: `dist/public`
- auth: real Firebase client config plus Firebase Admin credentials/workload identity
- file storage: writable local volume still required
- AI: Gemini supported when `GOOGLE_GENAI_API_KEY` is configured
- Redis: optional
- scraper ingest: token-gated when enabled
- SMS: route/service scaffold exists, provider transport not implemented

### Legacy Firebase/Netlify serverless paths

- status: retained but not canonical
- verification level: compatibility only
- should not be treated as the default deployment target

## What The Verifier Checks

`pnpm run env:verify:supported`

- loads root `.env` and `client/.env` when present
- checks database mode and production suitability
- checks upload directory and `FILE_SERVE_URL`
- checks Firebase client and admin wiring expectations
- checks AI, Redis, SMS, and scraper-ingest configuration
- reports unsupported production flags such as emulator or mock-public-data mode

## Current Implementation Truth

- file uploads are still local-disk based through [server/routes/files.ts](/workspace/server/routes/files.ts) and [server/fileService.ts](/workspace/server/fileService.ts)
- server-side Firebase still tolerates mock services in development through [server/firebase.ts](/workspace/server/firebase.ts)
- client-side Firebase can run in disabled or emulator-placeholder mode through [client/src/lib/firebase.ts](/workspace/client/src/lib/firebase.ts)
- SMS is configuration-aware but still transport-stubbed in [server/services/smsService.ts](/workspace/server/services/smsService.ts)

Those are verified realities, not just documentation caveats.
