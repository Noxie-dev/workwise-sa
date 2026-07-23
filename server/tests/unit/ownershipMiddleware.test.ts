import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../firebase', () => ({
  auth: { verifyIdToken: vi.fn() },
}));

vi.mock('../../services/authenticatedUser', () => ({
  resolveAuthenticatedDatabaseUser: vi.fn(),
}));

import { authorizeOwnership } from '../../middleware/auth';
import { resolveAuthenticatedDatabaseUser } from '../../services/authenticatedUser';

const mockedResolve = vi.mocked(resolveAuthenticatedDatabaseUser);

function response() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
}

describe('authorizeOwnership', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows the database owner even without a numeric Firebase claim', async () => {
    mockedResolve.mockResolvedValue({ id: 42, role: 'user' } as any);
    const next = vi.fn();

    await authorizeOwnership()({
      params: { userId: '42' },
      user: { uid: 'firebase-user' },
    } as any, response() as any, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('denies access to another database user', async () => {
    mockedResolve.mockResolvedValue({ id: 42, role: 'user' } as any);
    const res = response();

    await authorizeOwnership()({
      params: { userId: '99' },
      user: { uid: 'firebase-user' },
    } as any, res as any, vi.fn());

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'You can only access your own resources' });
  });

  it('rejects malformed owner IDs before database lookup', async () => {
    const res = response();

    await authorizeOwnership()({
      params: { userId: 'not-a-number' },
      user: { uid: 'firebase-user' },
    } as any, res as any, vi.fn());

    expect(res.statusCode).toBe(400);
    expect(mockedResolve).not.toHaveBeenCalled();
  });
});
