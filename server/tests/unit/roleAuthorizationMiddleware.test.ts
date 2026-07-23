import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../firebase', () => ({
  auth: { verifyIdToken: vi.fn() },
}));

vi.mock('../../services/authenticatedUser', () => ({
  resolveAuthenticatedDatabaseUser: vi.fn(),
}));

import { authorize } from '../../middleware/auth';
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

describe('database-backed role authorization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not trust an admin role claim when the database role is user', async () => {
    mockedResolve.mockResolvedValue({ id: 7, role: 'user' } as any);
    const res = response();

    await authorize(['admin'])({ user: { uid: 'firebase-user', role: 'admin' } } as any, res as any, vi.fn());

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Requires one of these roles: admin' });
  });

  it('allows a database admin role', async () => {
    mockedResolve.mockResolvedValue({ id: 1, role: 'admin' } as any);
    const next = vi.fn();

    await authorize(['admin'])({ user: { uid: 'firebase-admin' } } as any, response() as any, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('passes identity lookup failures to error handling', async () => {
    const failure = new Error('identity unavailable');
    mockedResolve.mockRejectedValue(failure);
    const next = vi.fn();

    await authorize(['admin'])({ user: { uid: 'firebase-user' } } as any, response() as any, next);

    expect(next).toHaveBeenCalledWith(failure);
  });
});
