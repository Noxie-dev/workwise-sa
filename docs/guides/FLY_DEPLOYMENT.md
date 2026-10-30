# Fly.io deployment

App: workwise-sa-noxie. Region: Johannesburg (jnb). Public URL: https://workwise-sa-noxie.fly.dev.

Dockerfile builds the frontend and bundled Express server with Node 22 and pnpm. fly.toml configures HTTPS on internal port 8080, health checks at /health, one 512MB shared CPU machine, automatic stopping when idle, and a persistent uploads volume mounted at /app/uploads. The database remains on Neon. Sample data is only seeded when SEED_SAMPLE_DATA=true.

Database and provider secrets are staged through Fly's encrypted secret store. A new random session secret was generated for this host. Local .env files and credential files are excluded from the Docker context. VITE_FIREBASE_* settings must be supplied as public build arguments when building the frontend; server secrets must not be used as build arguments.

Firebase Admin requires a replacement service-account credential or supported workload identity. The local GOOGLE_APPLICATION_CREDENTIALS path was missing during setup; it is not uploaded. Authenticated flows must be verified after credentials are installed. Never disable revocation checking to bypass missing credentials.

Free trial limits at setup: 2 aggregate VM hours or 7 days, whichever comes first. Trial machines stop after five minutes. Adding a payment method ends the free trial and starts billing. Check https://fly.io/docs/about/free-trial/ for current terms. No payment method was added during setup.

To deploy after authentication: flyctl deploy --remote-only --ha=false. Include public Firebase build arguments. To inspect: flyctl status; flyctl logs. To verify: GET /health, GET /api/categories, and authenticated file access with a real Firebase ID token.

## Live verification, 30 October 2026

Deployment succeeded. GET /health, /, and /api/categories returned HTTP 200. Unauthenticated /api/v1/users and /uploads/cvs/user-1/cv-1.pdf returned HTTP 401. Inserted a temporary category into Neon, retrieved its matching ID through the live Fly API, then removed it. An initial EAI_AGAIN DNS failure resolved on retry. All 62 server tests pass.

SECRET_SOURCE=env prevents fallback to Google Secret Manager on Fly. Firebase credentials are validated before background clients start. Missing Admin credentials leave protected Firebase operations unavailable while public routes continue. Public Firebase client configuration was obtained from the project's Firebase Hosting initialization endpoint and supplied as build arguments. AI keys in local configuration were placeholders and AI functionality is not verified.
