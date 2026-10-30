# Exposed Firebase credential remediation

The committed service-account key was removed from the working tree and ignored. Google Cloud denied key deletion for the currently signed-in account because it lacks iam.serviceAccountKeys.delete. A project administrator must revoke key 727ba80ab5e64bf161a361f781816257bda0f93e for firebase-adminsdk-fbsvc@workwise-sa-project.iam.gserviceaccount.com. Use application default credentials or secret-managed credentials for runtime replacement.

A local mirror with the credential path removed from all copied refs is prepared at /tmp/workwise-sa-clean-history.git. Remote history has not been rewritten. Coordinate a repository freeze, verify all remote branches and tags are included, publish cleaned refs, and have collaborators re-clone. Ask GitHub Support to clear cached sensitive content and affected pull request refs. Forks and prior clones remain separate copies. Revocation is essential regardless of history cleanup.

Run `pnpm exec tsx scripts/audit-account-security.ts` with an explicit DATABASE_URL for each deployed account database. The read-only report contains IDs and reasons, never password values. Require password resets for affected accounts and verify every privileged role and Firebase UID association against trusted provisioning records. Do not automatically preserve unverified administrator grants. Review access logs for misuse and rotate SESSION_SECRET wherever startup logs exposed it.

Deploy server changes and Firestore rules together. CV URLs now require a Firebase bearer token, so clients downloading CVs must use an authenticated request rather than direct browser navigation. Existing generic upload locations and alternate deployment entry points need an independent privacy review.
