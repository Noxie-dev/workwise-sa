import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('SquareJUMP worker safety contracts', () => {
  it('bounds application-link checks and closes the database on worker exit', () => {
    const service = source('server/services/squarejump/applicationLinkVerificationService.ts');
    const worker = source('server/workers/squareJumpLinkVerificationWorker.ts');

    expect(service).toContain('AbortController');
    expect(service).toContain('8_000');
    expect(service).toContain('Math.min(500');
    expect(worker).toContain('verifyApplicationLinks');
    expect(worker).toContain('closeDatabase()');
  });

  it('keeps match materialization bounded and closes the database on worker exit', () => {
    const service = source('server/services/squarejump/matchMaterializationService.ts');
    const worker = source('server/workers/squareJumpMatchMaterializationWorker.ts');

    expect(service).toContain('limit(batchSize)');
    expect(service).toContain('batchSize = 500');
    expect(worker).toContain('refreshAllUserJobMatches');
    expect(worker).toContain('closeDatabase()');
  });

  it('honors notification consent and per-user delivery limits', () => {
    const worker = source('server/services/squarejump/releaseWorker.ts');

    expect(worker).toContain("eq(notificationConsents.consentStatus, 'granted')");
    expect(worker).toContain("ne(notificationConsents.notificationMode, 'paused')");
    expect(worker).toContain('Number(daily?.total ?? 0) >= 10');
    expect(worker).toContain('squareJumpNotificationDeliveries');
  });
});
