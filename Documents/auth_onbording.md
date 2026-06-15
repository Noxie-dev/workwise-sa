**Findings**

- **Critical: profile APIs are public and trust the URL user id.** `GET /api/profile/:userId` and `PUT /api/profile/:userId` have no auth or ownership middleware, so anyone can read or overwrite profile data by Firebase UID or numeric id. See [server/routes/profile.ts](/workspace/server/routes/profile.ts:92) and [server/routes/profile.ts](/workspace/server/routes/profile.ts:116).

- **Critical: file APIs are public and trust a form `userId`.** Uploads, file listing, and deletion are unauthenticated; uploads also parse a caller-supplied `userId`. That allows arbitrary profile/CV uploads, file listing, and deletion. See [server/routes/files.ts](/workspace/server/routes/files.ts:39), [server/routes/files.ts](/workspace/server/routes/files.ts:116), [server/routes/files.ts](/workspace/server/routes/files.ts:193), [server/routes/files.ts](/workspace/server/routes/files.ts:340), and [server/routes/files.ts](/workspace/server/routes/files.ts:362).

- **High: account creation does not create a database user/profile.** Register only calls Firebase Auth, then redirects; it never calls `/api/users/register`, `/api/v1/users/register`, or a Firebase-token-backed user bootstrap endpoint. See [client/src/pages/Register.tsx](/workspace/client/src/pages/Register.tsx:128). As a result, `/api/profile/:firebaseUid` usually 404s.

- **High: onboarding does not persist the completed profile.** `ProfileSetup` builds `completeProfileData` but only logs it, shows success, and navigates to `/profile`; it even navigates after errors. See [client/src/pages/ProfileSetup.tsx](/workspace/client/src/pages/ProfileSetup.tsx:701) and [client/src/pages/ProfileSetup.tsx](/workspace/client/src/pages/ProfileSetup.tsx:744). The profile page then masks this by rendering a local fallback profile on fetch failure at [client/src/pages/UserProfile.tsx](/workspace/client/src/pages/UserProfile.tsx:82).

- **High: profile/CV helper endpoints are miswired.** The client calls `/api/scan-cv`, `/api/enhance-image`, and `/api/process-ai-prompt`, but the server mounts them under `/api/profile/...`. See [client/src/services/profileService.ts](/workspace/client/src/services/profileService.ts:145) and [server/routes.ts](/workspace/server/routes.ts:39). Also, server CV/image handlers are placeholder/sample responses, not real multipart processing.

- **Medium: sign-in routing ignores profile completion.** Email/password, Google, and email-link sign-in all route to `/profile-setup` regardless of whether the user already has a profile. See [client/src/pages/Login.tsx](/workspace/client/src/pages/Login.tsx:104) and [client/src/pages/EmailSignInComplete.tsx](/workspace/client/src/pages/EmailSignInComplete.tsx:47).

- **Medium: `/profile` hangs for anonymous users.** The route is public, and `UserProfile` returns early when `currentUser` is null without clearing `loading`, so direct anonymous visits can sit on “Loading...” forever. See [client/src/core/app.tsx](/workspace/client/src/core/app.tsx:121) and [client/src/pages/UserProfile.tsx](/workspace/client/src/pages/UserProfile.tsx:68).

**Recommended Fix Order**

1. Protect `/api/profile` and `/api/files` with Firebase token verification plus ownership checks.
2. Add a token-backed “ensure database user” step after Firebase signup/sign-in.
3. Make onboarding call `profileService.updateProfile(currentUser.uid, completeProfileData)` and only navigate on success.
4. Fix profile helper URLs to `/api/profile/...` or move the server routes to match the client.
5. Add auth/onboarding tests covering signup, returning login, profile save, anonymous profile access, and cross-user profile/file access.

I audited only; I did not modify files or run tests.