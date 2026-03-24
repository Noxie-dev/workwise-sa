# AI Support Matrix

This file defines which AI endpoints are considered production-supported versus experimental.

## Production-Supported

- CV summary generation through the canonical API
- Job description generation through the canonical API
- Translation through the canonical API
- Claude/Gemini-backed flows that already participate in product workflows under [server/routes/v1.ts](/workspace/server/routes/v1.ts)

Production-supported means:

- the endpoint is part of the product surface
- missing provider configuration is treated as a deployment/config issue
- callers should receive explicit failure rather than placeholder text

## Experimental

- generic prompt completion in [server/routes/aiRoutes.ts](/workspace/server/routes/aiRoutes.ts)
- greeting/demo endpoints in [server/routes/aiRoutes.ts](/workspace/server/routes/aiRoutes.ts)

Experimental means:

- disabled in production unless `ENABLE_EXPERIMENTAL_AI_ENDPOINTS=true`
- not required for core user journeys
- may change shape or be removed without being treated as a regression in core product behavior

## Decision

The repo keeps product-specific AI features and demotes generic playground/demo endpoints.
