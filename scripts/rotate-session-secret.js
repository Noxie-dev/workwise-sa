#!/usr/bin/env node

import crypto from 'node:crypto';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const args = new Set(process.argv.slice(2));
const projectId = process.env.GCP_PROJECT_ID || 'workwise-sa-project';
const secretId = process.env.SESSION_SECRET_NAME || 'SESSION_SECRET';
const disablePrevious = args.has('--disable-previous');

function usage() {
  console.log('Usage: pnpm run security:rotate-session-secret [-- --dry-run] [-- --disable-previous]');
  console.log('Adds and verifies a cryptographically random Secret Manager version without printing its value.');
  console.log('--dry-run             Generate and validate locally; do not contact Secret Manager.');
  console.log('--disable-previous    Disable older enabled versions after the new version verifies.');
}

if (args.has('--help')) {
  usage();
  process.exit(0);
}

const candidate = crypto.randomBytes(48).toString('base64url');

if (args.has('--dry-run')) {
  const candidateLength = candidate.length;
  console.log(`Dry run passed: generated a ${candidateLength}-character candidate; value was not printed or persisted.`);
  process.exit(0);
}

const client = new SecretManagerServiceClient();
const parent = `projects/${projectId}/secrets/${secretId}`;

// The Google client can surface an ADC failure on a later promise tick after
// the RPC has already rejected. Keep that infrastructure error non-sensitive
// and concise; the command never prints the generated candidate.
process.on('unhandledRejection', () => {
  process.exitCode = 1;
});

try {
  const [version] = await client.addSecretVersion({
    parent,
    payload: { data: Buffer.from(candidate, 'utf8') },
  });
  const versionName = version.name;
  if (!versionName) throw new Error('Secret Manager did not return a version name');

  const [verifiedVersion] = await client.accessSecretVersion({ name: versionName });
  const verified = verifiedVersion.payload?.data?.toString('utf8');
  if (verified !== candidate) throw new Error('Secret Manager verification did not match the new version');

  if (disablePrevious) {
    const [versions] = await client.listSecretVersions({ parent, filter: 'state = ENABLED' });
    let disabled = 0;
    for (const previous of versions) {
      if (previous.name && previous.name !== versionName) {
        await client.disableSecretVersion({ name: previous.name });
        disabled += 1;
      }
    }
    console.log(`Session secret rotated and verified; disabled ${disabled} previous enabled version(s).`);
  } else {
    console.log('Session secret version rotated and verified; previous versions remain enabled for rollout safety.');
    console.log('Restart every production workload, verify the new version, then rerun with --disable-previous.');
  }
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error ? ` (code ${(error).code})` : '';
  console.error(`Session secret rotation could not complete${code}. Configure Google ADC and Secret Manager access, then retry.`);
  process.exitCode = 1;
} finally {
  await client.close().catch(() => undefined);
}
