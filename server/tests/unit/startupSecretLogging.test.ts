import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production startup secret handling', () => {
  it('does not log the session secret value during startup preload', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'server/server/index.ts'),
      'utf8',
    );

    expect(source).not.toMatch(
      /(?:console|logger)\.(?:log|info|debug|warn|error)\([^\n;]*SESSION_SECRET/,
    );
    expect(source).not.toMatch(/process\.env\.SESSION_SECRET/);
  });
});
