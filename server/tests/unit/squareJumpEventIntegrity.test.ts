import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SquareJUMP event integrity contract', () => {
  it('binds events to the authenticated user, job, and exposure token', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'server/routes/squareJump.ts'),
      'utf8',
    );

    expect(source).toContain('eq(recommendationExposures.trackingToken, parsed.data.trackingToken)');
    expect(source).toContain('eq(recommendationExposures.jobId, job.id)');
    expect(source).toContain('eq(recommendationExposures.userId, user.id)');
    expect(source).toContain('onConflictDoNothing({ target: jobEvents.eventKey })');
    expect(source).toContain('eventKey');
  });
});
