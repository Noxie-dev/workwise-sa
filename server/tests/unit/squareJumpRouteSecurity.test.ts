import { describe, expect, it } from 'vitest';
import router from '../../routes/squareJump';

function middlewareNames(path: string, method: string) {
  const layer = router.stack.find(
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method],
  );
  if (!layer) throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  return layer.route.stack.map((entry: any) => entry.handle.name);
}

describe('SquareJUMP route security contract', () => {
  it.each([
    ['get', '/jobs/recommendations'],
    ['put', '/jobs/match-profile'],
    ['get', '/notification-consents'],
    ['put', '/notification-consents/:channel'],
    ['post', '/job-events'],
  ])('requires Firebase authentication for %s %s', (method, path) => {
    expect(middlewareNames(path, method)).toContain('verifyFirebaseToken');
  });

  it.each([
    ['post', '/admin/squarejump/policies/simulate'],
    ['post', '/admin/squarejump/policies/:id/activate'],
    ['post', '/admin/squarejump/policies/:id/rollback'],
    ['post', '/admin/squarejump/jobs/:juid/recalculate'],
    ['get', '/admin/squarejump/duplicates'],
    ['post', '/admin/squarejump/duplicates/:id/resolve'],
  ])('requires authentication and authorization for %s %s', (method, path) => {
    const names = middlewareNames(path, method);
    expect(names).toContain('verifyFirebaseToken');
    expect(names).toContain('');
  });
});
