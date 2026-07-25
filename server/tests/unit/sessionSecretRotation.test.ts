import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('session secret rotation hygiene', () => {
  it('generates and verifies a secret without printing or persisting its value', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'scripts/rotate-session-secret.js'),
      'utf8',
    );

    expect(source).toContain("crypto.randomBytes(48)");
    expect(source).toContain('accessSecretVersion');
    expect(source).toContain('verified !== candidate');
    expect(source).not.toMatch(/console\.(?:log|error)\([^\n;]*\$\{candidate\}/);
    expect(source).not.toMatch(/console\.(?:log|error)\([^\n;]*\$\{verified\}/);
    expect(source).not.toMatch(/process\.env\.SESSION_SECRET(?:[^A-Z0-9_]|$)/);
  });
});
