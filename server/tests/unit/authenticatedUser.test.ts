import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../storage', () => ({
  storage: {
    getUserByFirebaseUid: vi.fn(),
    createUser: vi.fn(),
  },
}));

import { storage } from '../../storage';
import { assertRole, resolveAuthenticatedDatabaseUser } from '../../services/authenticatedUser';

const mockedStorage = vi.mocked(storage);

describe('authenticatedUser service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the existing database user when firebase uid is already linked', async () => {
    const existingUser = {
      id: 7,
      firebaseUid: 'firebase-uid-1',
      email: 'candidate@example.com',
      name: 'Candidate',
      role: 'user',
    };

    mockedStorage.getUserByFirebaseUid.mockResolvedValue(existingUser as any);

    const result = await resolveAuthenticatedDatabaseUser({
      uid: 'firebase-uid-1',
      email: 'candidate@example.com',
    });

    expect(result).toBe(existingUser);
    expect(mockedStorage.createUser).not.toHaveBeenCalled();
  });

  it('creates a database user from firebase identity when no linked user exists', async () => {
    mockedStorage.getUserByFirebaseUid.mockResolvedValue(undefined as any);
    mockedStorage.createUser.mockResolvedValue({
      id: 11,
      firebaseUid: 'firebase-uid-2',
      email: 'new.user@example.com',
      name: 'new.user',
      role: 'employer',
    } as any);

    const result = await resolveAuthenticatedDatabaseUser({
      uid: 'firebase-uid-2',
      email: 'new.user@example.com',
      role: 'employer',
    });

    expect(mockedStorage.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new.user@example.com',
        firebaseUid: 'firebase-uid-2',
        username: 'firebase-firebase-uid',
        name: 'new.user',
        role: 'employer',
      }),
    );
    expect(result.id).toBe(11);
  });

  it('rejects firebase identities without uid', async () => {
    await expect(resolveAuthenticatedDatabaseUser({ email: 'missing-uid@example.com' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('rejects creation when firebase user has no email', async () => {
    mockedStorage.getUserByFirebaseUid.mockResolvedValue(undefined as any);

    await expect(resolveAuthenticatedDatabaseUser({ uid: 'firebase-uid-3' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('assertRole allows approved roles and blocks unauthorized roles', () => {
    expect(() => assertRole({ role: 'admin' }, ['admin', 'employer'])).not.toThrow();
    expect(() => assertRole({ role: 'user' }, ['admin', 'employer'])).toThrowError(
      /permission/i,
    );
  });
});
