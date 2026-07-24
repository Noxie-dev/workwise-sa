import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('legacy Firebase function security surface', () => {
  it('keeps profile and file TODO handlers authenticated and fail closed', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'functions/index.js'), 'utf8');

    expect(source).toMatch(/app\.post\("\/files\/upload-profile-image", requireFirebaseUser, unavailableLegacyEndpoint\)/);
    expect(source).toMatch(/app\.post\("\/files\/upload-professional-image", requireFirebaseUser, unavailableLegacyEndpoint\)/);
    expect(source).toMatch(/app\.get\("\/profile\/:userId", requireFirebaseUser, requireOwnProfile, unavailableLegacyEndpoint\)/);
    expect(source).toMatch(/app\.put\("\/profile\/:userId", requireFirebaseUser, requireOwnProfile, unavailableLegacyEndpoint\)/);
    expect(source).toMatch(/status\(501\)\.json/);
  });

  it('requires callable authentication and ownership for profile processing', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'functions/index.js'), 'utf8');

    expect(source).toMatch(/if \(!request\.auth\)/);
    expect(source).toMatch(/throw new HttpsError\("unauthenticated"/);
    expect(source).toMatch(/throw new HttpsError\("permission-denied"/);
  });
});
