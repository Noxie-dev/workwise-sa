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
    getJob: vi.fn(),
    getJobApplicationByUserAndJob: vi.fn(),
    createJobApplication: vi.fn(),
    createUserInteraction: vi.fn(),
    getJobApplication: vi.fn(),
    updateJobApplication: vi.fn(),
    createUserNotification: vi.fn(),
    deleteJobApplication: vi.fn(),
    getJobApplicationsByJob: vi.fn(),
    getJobApplicationsByUser: vi.fn(),
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
  assertRole: vi.fn(),
}));

import { storage } from '../../storage';
import { errorHandler } from '../../middleware/errorHandler';
import router from '../../routes/jobApplications';
import { assertRole, resolveAuthenticatedDatabaseUser } from '../../services/authenticatedUser';

const mockedStorage = vi.mocked(storage);
const mockedResolveAuthenticatedDatabaseUser = vi.mocked(resolveAuthenticatedDatabaseUser);
const mockedAssertRole = vi.mocked(assertRole);

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
  method: 'get' | 'post' | 'put' | 'delete';
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

describe('jobApplications routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 7,
      role: 'user',
      email: 'candidate@example.com',
    } as any);
    mockedAssertRole.mockImplementation(() => undefined);
  });

  it('creates a job application and logs the interaction', async () => {
    mockedStorage.getJob.mockResolvedValue({ id: 22, title: 'Cashier' } as any);
    mockedStorage.getJobApplicationByUserAndJob.mockResolvedValue(undefined as any);
    mockedStorage.createJobApplication.mockResolvedValue({
      id: 101,
      userId: 7,
      jobId: 22,
      status: 'applied',
    } as any);
    mockedStorage.createUserInteraction.mockResolvedValue({ id: 501 } as any);

    const response = await invokeRoute({
      path: '/',
      method: 'post',
      req: {
        body: {
          jobId: 22,
          coverLetter: 'I am interested in this role.',
        },
        params: {},
        query: {},
        headers: {
          authorization: 'Bearer test-token',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(mockedStorage.createJobApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        jobId: 22,
        status: 'applied',
      }),
    );
    expect(mockedStorage.createUserInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        interactionType: 'apply',
        jobId: 22,
      }),
    );
  });

  it('rejects duplicate job applications', async () => {
    mockedStorage.getJob.mockResolvedValue({ id: 22, title: 'Cashier' } as any);
    mockedStorage.getJobApplicationByUserAndJob.mockResolvedValue({
      id: 99,
      userId: 7,
      jobId: 22,
    } as any);

    const response = await invokeRoute({
      path: '/',
      method: 'post',
      req: {
        body: { jobId: 22 },
        params: {},
        query: {},
        headers: {
          authorization: 'Bearer test-token',
        },
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.message).toMatch(/already applied/i);
    expect(mockedStorage.createJobApplication).not.toHaveBeenCalled();
  });

  it('blocks job-level application listing when role assertion fails', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 8,
      role: 'user',
      email: 'candidate@example.com',
    } as any);
    mockedAssertRole.mockImplementation(() => {
      throw Object.assign(new Error('You do not have permission to access this resource'), {
        statusCode: 403,
      });
    });

    const response = await invokeRoute({
      path: '/job/:jobId',
      method: 'get',
      req: {
        body: {},
        params: { jobId: '33' },
        query: {
          page: '1',
          limit: '20',
          sortBy: 'appliedAt',
          sortOrder: 'desc',
        },
        headers: {
          authorization: 'Bearer test-token',
        },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/permission/i);
    expect(mockedStorage.getJobApplicationsByJob).not.toHaveBeenCalled();
  });

  it('updates an application and creates a notification on status change', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 1,
      role: 'admin',
      email: 'admin@example.com',
    } as any);
    mockedStorage.getJobApplication.mockResolvedValue({
      id: 55,
      userId: 7,
      jobId: 22,
      status: 'applied',
    } as any);
    mockedStorage.updateJobApplication.mockResolvedValue({
      id: 55,
      userId: 7,
      jobId: 22,
      status: 'reviewed',
    } as any);
    mockedStorage.createUserInteraction.mockResolvedValue({ id: 88 } as any);
    mockedStorage.createUserNotification.mockResolvedValue({ id: 89 } as any);

    const response = await invokeRoute({
      path: '/:applicationId',
      method: 'put',
      req: {
        body: { status: 'reviewed', notes: 'Looks promising' },
        params: { applicationId: '55' },
        query: {},
        headers: {
          authorization: 'Bearer test-token',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockedStorage.createUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        type: 'application_status_update',
        jobId: 22,
      }),
    );
  });

  it('blocks an employer from reading another employer\'s application', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 11,
      role: 'employer',
      email: 'employer@example.com',
    } as any);
    mockedStorage.getJobApplication.mockResolvedValue({
      id: 55,
      userId: 7,
      jobId: 22,
      status: 'applied',
    } as any);
    mockedStorage.getJob.mockResolvedValue({
      id: 22,
      createdByUserId: 99,
    } as any);

    const response = await invokeRoute({
      path: '/:applicationId',
      method: 'get',
      req: {
        body: {},
        params: { applicationId: '55' },
        query: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
  });

  it('blocks an employer from listing another employer\'s applications', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 11,
      role: 'employer',
      email: 'employer@example.com',
    } as any);
    mockedStorage.getJob.mockResolvedValue({
      id: 22,
      createdByUserId: 99,
    } as any);

    const response = await invokeRoute({
      path: '/job/:jobId',
      method: 'get',
      req: {
        body: {},
        params: { jobId: '22' },
        query: {
          page: '1',
          limit: '20',
          sortBy: 'appliedAt',
          sortOrder: 'desc',
        },
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
    expect(mockedStorage.getJobApplicationsByJob).not.toHaveBeenCalled();
  });

  it('blocks an employer from listing applications for a legacy unowned job', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 11,
      role: 'employer',
      email: 'employer@example.com',
    } as any);
    mockedStorage.getJob.mockResolvedValue({
      id: 23,
      createdByUserId: null,
    } as any);

    const response = await invokeRoute({
      path: '/job/:jobId',
      method: 'get',
      req: {
        body: {},
        params: { jobId: '23' },
        query: {
          page: '1',
          limit: '20',
          sortBy: 'appliedAt',
          sortOrder: 'desc',
        },
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
    expect(mockedStorage.getJobApplicationsByJob).not.toHaveBeenCalled();
  });

  it('blocks an employer from changing another employer\'s application status', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 11,
      role: 'employer',
      email: 'employer@example.com',
    } as any);
    mockedStorage.getJobApplication.mockResolvedValue({
      id: 56,
      userId: 7,
      jobId: 22,
      status: 'applied',
    } as any);
    mockedStorage.getJob.mockResolvedValue({
      id: 22,
      createdByUserId: 99,
    } as any);

    const response = await invokeRoute({
      path: '/:applicationId',
      method: 'put',
      req: {
        body: { status: 'hired' },
        params: { applicationId: '56' },
        query: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
    expect(mockedStorage.updateJobApplication).not.toHaveBeenCalled();
    expect(mockedStorage.createUserNotification).not.toHaveBeenCalled();
  });

  it('blocks an employer from changing application status for a legacy unowned job', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 11,
      role: 'employer',
      email: 'employer@example.com',
    } as any);
    mockedStorage.getJobApplication.mockResolvedValue({
      id: 58,
      userId: 7,
      jobId: 23,
      status: 'applied',
    } as any);
    mockedStorage.getJob.mockResolvedValue({
      id: 23,
      createdByUserId: null,
    } as any);

    const response = await invokeRoute({
      path: '/:applicationId',
      method: 'put',
      req: {
        body: { status: 'hired' },
        params: { applicationId: '58' },
        query: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
    expect(mockedStorage.updateJobApplication).not.toHaveBeenCalled();
  });

  it('fails closed for an unrecognized non-admin role on another tenant\'s application', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 11,
      role: 'company_manager',
      email: 'manager@example.com',
    } as any);
    mockedStorage.getJobApplication.mockResolvedValue({
      id: 57,
      userId: 11,
      jobId: 22,
      status: 'applied',
    } as any);
    mockedStorage.getJob.mockResolvedValue({
      id: 22,
      createdByUserId: 99,
    } as any);

    const response = await invokeRoute({
      path: '/:applicationId',
      method: 'get',
      req: {
        body: {},
        params: { applicationId: '57' },
        query: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
  });

  it('fails closed when an unrecognized role attempts to withdraw an application', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 11,
      role: 'company_manager',
      email: 'manager@example.com',
    } as any);
    mockedStorage.getJobApplication.mockResolvedValue({
      id: 59,
      userId: 11,
      jobId: 23,
      status: 'applied',
    } as any);

    const response = await invokeRoute({
      path: '/:applicationId',
      method: 'delete',
      req: {
        body: {},
        params: { applicationId: '59' },
        query: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/only candidates/i);
    expect(mockedStorage.deleteJobApplication).not.toHaveBeenCalled();
  });

  it('prevents candidates from changing employer-controlled application status', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 7,
      role: 'user',
      email: 'candidate@example.com',
    } as any);
    mockedStorage.getJobApplication.mockResolvedValue({
      id: 56,
      userId: 7,
      jobId: 22,
      status: 'applied',
    } as any);

    const response = await invokeRoute({
      path: '/:applicationId',
      method: 'put',
      req: {
        body: { status: 'hired' },
        params: { applicationId: '56' },
        query: {},
        headers: { authorization: 'Bearer test-token' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/only employers or administrators/i);
    expect(mockedStorage.updateJobApplication).not.toHaveBeenCalled();
  });
});
