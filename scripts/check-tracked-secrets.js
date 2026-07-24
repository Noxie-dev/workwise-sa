#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const privateKeyPattern = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const databaseUrlPattern = /(?:postgres(?:ql)?|mysql):\/\/([^:\s]+):([^@\s]+)@([^/\s]+)/gi;

const findings = [];

for (const file of trackedFiles) {
  let contents;
  try {
    contents = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const privateKeyMatch = privateKeyPattern.exec(contents);
  const keyContext = privateKeyMatch
    ? contents.slice(Math.max(0, privateKeyMatch.index - 120), privateKeyMatch.index + 320)
    : '';
  if (privateKeyMatch && !/your[_-]|placeholder|example|replace[_-]?me/i.test(keyContext)) {
    findings.push(`${file}: private-key material`);
  }

  for (const match of contents.matchAll(databaseUrlPattern)) {
    const [, , password, host] = match;
    const isLocal = /^(localhost|127\.0\.0\.1|::1)$/i.test(host);
    const isDefault = /^(postgres|password|secret|your[_-]?|placeholder|example)/i.test(password);
    if (!isLocal && !isDefault) {
      findings.push(`${file}: credentialed database URL`);
      break;
    }
  }
}

if (findings.length > 0) {
  console.error('Tracked-secret check failed. Rotate the affected credentials and purge them from history.');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Tracked-secret check passed for ${trackedFiles.length} files.`);
