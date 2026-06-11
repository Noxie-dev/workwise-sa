import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../storage', () => ({
  storage: {
    getJob: vi.fn(),
    getUserFavoriteJobs: vi.fn(),
    isJobFavorited: vi.fn(),
    addJobToFavorites: vi.fn(),
    removeJobFromFavorites: vi.fn(),
    getUserFavoriteJobsCount: vi.fn(),
    createUserInteraction: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../middleware/auth', () => ({
  verifyFirebaseToken: (req: any, _res: any, next: (error?: unknown) => void) => {
    req.user = {
      uid: 'firebase-user-1',
      email: 'candidate@example.com',
    };
    next();
  },
}));

vi.mock('../../services/authenticatedUser', () => ({
  resolveAuthenticatedDatabaseUser: vi.fn(),
}));

import { storage } from '../../storage';
import router from '../../routes/jobFavorites';
import { errorHandler } from '../../middleware/errorHandler';
import { resolveAuthenticatedDatabaseUser } from '../../services/authenticatedUser';

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
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method]
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
  method: 'get' | 'post' | 'delete';
  req: Record<string, any>;
}) {
  const handlers = getRouteHandlers(path, method);
  const response = createMockResponse();
  let capturedError: unknown;

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

describe('job favorites routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 7,
      role: 'user',
      email: 'candidate@example.com',
    } as any);
  });

  it('returns the authenticated user favorite jobs', async () => {
    mockedStorage.getUserFavoriteJobs.mockResolvedValue({
      jobs: [{ id: 22, title: 'Cashier', company: { id: 3, name: 'Shoprite' } }],
      total: 1,
    } as any);

    const response = await invokeRoute({
      path: '/favorites',
      method: 'get',
      req: {
        params: {},
        query: { page: '1', limit: '20', sortBy: 'createdAt', sortOrder: 'desc' },
        body: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.jobs).toHaveLength(1);
    expect(mockedStorage.getUserFavoriteJobs).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ page: 1 })
    );
  });

  it('adds a job to favorites', async () => {
    mockedStorage.getJob.mockResolvedValue({ id: 22, title: 'Cashier' } as any);
    mockedStorage.isJobFavorited.mockResolvedValue(false);
    mockedStorage.addJobToFavorites.mockResolvedValue({ userId: 7, jobId: 22 } as any);
    mockedStorage.createUserInteraction.mockResolvedValue({ id: 8 } as any);

    const response = await invokeRoute({
      path: '/:jobId/favorite',
      method: 'post',
      req: {
        params: { jobId: '22' },
        query: {},
        body: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.isFavorited).toBe(true);
    expect(mockedStorage.addJobToFavorites).toHaveBeenCalledWith(7, 22);
  });

  it('removes a job from favorites', async () => {
    mockedStorage.isJobFavorited.mockResolvedValue(true);
    mockedStorage.removeJobFromFavorites.mockResolvedValue(true);
    mockedStorage.createUserInteraction.mockResolvedValue({ id: 8 } as any);

    const response = await invokeRoute({
      path: '/:jobId/favorite',
      method: 'delete',
      req: {
        params: { jobId: '22' },
        query: {},
        body: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.isFavorited).toBe(false);
    expect(mockedStorage.removeJobFromFavorites).toHaveBeenCalledWith(7, 22);
  });

  it('returns the saved job count', async () => {
    mockedStorage.getUserFavoriteJobsCount.mockResolvedValue(4);

    const response = await invokeRoute({
      path: '/favorites/count',
      method: 'get',
      req: {
        params: {},
        query: {},
        body: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(4);
  });
});
