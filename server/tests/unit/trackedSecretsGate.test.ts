import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('tracked-secret release gate', () => {
  it('never prints secret values when reporting a finding', () => {
    const result = spawnSync('node', ['scripts/check-tracked-secrets.js'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const output = `${result.stdout}${result.stderr}`;

    expect([0, 1]).toContain(result.status);
    expect(output).not.toMatch(/BEGIN PRIVATE KEY/);
    expect(output).not.toMatch(/postgres(?:ql)?:\/\/[^\s]+:[^@\s]+@/i);
    if (result.status === 1) {
      expect(output).toContain('Tracked-secret check failed');
      expect(output).toContain('.env.production');
    }
  });
});
