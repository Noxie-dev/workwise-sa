import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../storage', () => ({
  storage: {
    getUserProfile: vi.fn(),
    getUserProfileByFirebaseUid: vi.fn(),
    getUserByFirebaseUid: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

vi.mock('../../services/authenticatedUser', () => ({
  resolveAuthenticatedDatabaseUser: vi.fn(),
}));

import { storage } from '../../storage';
import { resolveAuthenticatedDatabaseUser } from '../../services/authenticatedUser';
import { errorHandler } from '../../middleware/errorHandler';
import router from '../../routes/profile';

const mockedStorage = vi.mocked(storage);
const mockedResolveAuthenticatedDatabaseUser = vi.mocked(resolveAuthenticatedDatabaseUser);

function createMockResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
  };

  return response;
}

function getRouteHandlers(path: string, method: string) {
  const layer = router.stack.find(
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method],
  );

  if (!layer) {
    throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack.map((entry: any) => entry.handle);
}

async function invokeRoute({
  path,
  method,
  req,
}: {
  path: string;
  method: 'get' | 'put';
  req: Record<string, any>;
}) {
  const handlers = getRouteHandlers(path, method);
  const response = createMockResponse();
  let capturedError: unknown;
  req.user = req.user || { uid: 'firebase-uid-42' };

  for (const handler of handlers) {
    await handler(req, response, (error?: unknown) => {
      if (error) {
        capturedError = error;
      }
    });

    if (capturedError || response.body) {
      break;
    }
  }

  if (capturedError) {
    errorHandler(capturedError, req as any, response as any, vi.fn());
  }

  return response;
}

describe('profile routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 42,
      firebaseUid: 'firebase-uid-42',
      role: 'user',
    } as any);
  });

  it('returns a profile by numeric user id', async () => {
    mockedStorage.getUserProfile.mockResolvedValue({
      userId: 42,
      personal: { fullName: 'Test Candidate' },
    } as any);

    const response = await invokeRoute({
      path: '/:userId',
      method: 'get',
      req: {
        params: { userId: '42' },
        query: {},
        body: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        userId: 42,
        personal: { fullName: 'Test Candidate' },
      },
    });
    expect(mockedStorage.getUserProfile).toHaveBeenCalledWith(42);
  });

  it('returns a profile by firebase uid when the route param is non-numeric', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      userId: 77,
      id: 77,
      firebaseUid: 'firebase-uid-77',
      role: 'user',
    } as any);
    mockedStorage.getUserProfile.mockResolvedValue({
      userId: 77,
      firebaseUid: 'firebase-uid-77',
      personal: { fullName: 'Firebase User' },
    } as any);

    const response = await invokeRoute({
      path: '/:userId',
      method: 'get',
      req: {
        params: { userId: 'firebase-uid-77' },
        query: {},
        body: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mockedStorage.getUserProfile).toHaveBeenCalledWith(77);
  });

  it('updates a profile by resolved firebase uid lookup', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 55,
      firebaseUid: 'firebase-uid-55',
      role: 'user',
    } as any);
    mockedStorage.updateUserProfile.mockResolvedValue({
      userId: 55,
      personal: { fullName: 'Updated Name' },
      preferences: { willingToRelocate: true },
    } as any);

    const response = await invokeRoute({
      path: '/:userId',
      method: 'put',
      req: {
        params: { userId: 'firebase-uid-55' },
        query: {},
        body: {
          personal: { fullName: 'Updated Name' },
          preferences: { willingToRelocate: true },
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockedStorage.updateUserProfile).toHaveBeenCalledWith(
      55,
      expect.objectContaining({
        personal: { fullName: 'Updated Name' },
        preferences: { willingToRelocate: true },
      }),
    );
  });

  it('returns not found when updating a profile for an unknown firebase uid', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 42,
      firebaseUid: 'firebase-uid-42',
      role: 'user',
    } as any);

    const response = await invokeRoute({
      path: '/:userId',
      method: 'put',
      req: {
        params: { userId: 'missing-firebase-uid' },
        query: {},
        body: {
          personal: { fullName: 'Missing User' },
        },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/only access your own profile/i);
  });
});
