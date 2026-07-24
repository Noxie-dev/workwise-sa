import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectResults: any[] = [];
const insertResults: any[] = [];
const updateResults: any[] = [];

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => {
        const query: any = {
        where: vi.fn(() => ({
          limit: vi.fn(async () => selectResults.shift() ?? []),
        })),
        orderBy: vi.fn(async () => selectResults.shift() ?? []),
        };
        query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(selectResults.shift() ?? []));
        return query;
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => insertResults.shift() ?? []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => updateResults.shift() ?? []),
        })),
      })),
    })),
  },
}));

vi.mock('../../middleware/auth', () => ({
  verifyFirebaseToken: (_req: any, _res: any, next: (error?: unknown) => void) => next(),
}));

vi.mock('../../services/authenticatedUser', () => ({
  resolveAuthenticatedDatabaseUser: vi.fn(),
  assertRole: vi.fn(),
}));

import router from '../../routes/employer';
import { errorHandler } from '../../middleware/errorHandler';
import { assertRole, resolveAuthenticatedDatabaseUser } from '../../services/authenticatedUser';

const mockedResolveAuthenticatedDatabaseUser = vi.mocked(resolveAuthenticatedDatabaseUser);
const mockedAssertRole = vi.mocked(assertRole);

function createMockResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
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
  method: 'get' | 'post' | 'put' | 'patch';
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

describe('employer routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResults.length = 0;
    insertResults.length = 0;
    updateResults.length = 0;

    mockedResolveAuthenticatedDatabaseUser.mockResolvedValue({
      id: 11,
      role: 'employer',
      email: 'employer@example.com',
      name: 'Employer User',
    } as any);
    mockedAssertRole.mockImplementation(() => undefined);
  });

  it('creates a draft employer job', async () => {
    selectResults.push([], []);
    insertResults.push(
      [{ id: 3, name: 'Acme', slug: 'acme', logo: null, location: 'Cape Town' }],
      [{ id: 4, name: 'Retail Assistant', slug: 'retail-assistant', icon: 'briefcase', jobCount: 0 }],
      [{
        id: 55,
        title: 'Retail Assistant',
        description: 'Help customers on the shop floor.',
        location: 'Cape Town',
        salary: 'Negotiable',
        jobType: 'full-time',
        workMode: 'On-site',
        companyId: 3,
        categoryId: 4,
        status: 'draft',
        createdAt: new Date('2026-03-25T00:00:00Z'),
      }],
    );

    const response = await invokeRoute({
      path: '/jobs',
      method: 'post',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: {},
        query: {},
        body: {
          title: 'Retail Assistant',
          category: 'retail-assistant',
          jobType: 'full-time',
          location: 'Cape Town',
          isRemote: false,
          applicationDeadline: '',
          salaryMin: '',
          salaryMax: '',
          isSalaryNegotiable: true,
          description: 'Help customers on the shop floor.',
          responsibilities: '',
          requirements: '',
          companyName: 'Acme',
          companyLogo: null,
          companyBio: '',
          contactName: 'Employer User',
          contactEmail: 'employer@example.com',
          contactPhone: '',
          website: '',
          howToApply: 'email',
          applicationEmail: 'employer@example.com',
          applicationUrl: '',
          customInstructions: '',
          isConfidential: false,
          isDraft: true,
          screenerQuestions: [],
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.status).toBe('draft');
    expect(response.body.companyId).toBe(3);
    expect(response.body.categoryId).toBe(4);
  });

  it('updates a job status', async () => {
    selectResults.push([{ id: 55, createdByUserId: 11 }]);
    updateResults.push([{ id: 55, status: 'paused' }]);

    const response = await invokeRoute({
      path: '/jobs/:jobId/status',
      method: 'patch',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: { jobId: '55' },
        query: {},
        body: { status: 'paused' },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      jobId: '55',
      status: 'paused',
    });
  });

  it('rejects status changes for another employer\'s job', async () => {
    selectResults.push([{ id: 55, createdByUserId: 99 }]);

    const response = await invokeRoute({
      path: '/jobs/:jobId/status',
      method: 'patch',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: { jobId: '55' },
        query: {},
        body: { status: 'paused' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
    expect(updateResults).toHaveLength(0);
  });

  it('rejects status changes for legacy jobs without an owner', async () => {
    selectResults.push([{ id: 56, createdByUserId: null }]);

    const response = await invokeRoute({
      path: '/jobs/:jobId/status',
      method: 'patch',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: { jobId: '56' },
        query: {},
        body: { status: 'paused' },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
    expect(updateResults).toHaveLength(0);
  });

  it('rejects detail reads for another employer\'s job', async () => {
    selectResults.push([{ id: 55, createdByUserId: 99 }]);

    const response = await invokeRoute({
      path: '/jobs/:jobId',
      method: 'get',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: { jobId: '55' },
        query: {},
        body: {},
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
  });

  it('rejects edits for another employer\'s job before parsing or writing', async () => {
    selectResults.push([{ id: 55, createdByUserId: 99 }]);

    const response = await invokeRoute({
      path: '/jobs/:jobId',
      method: 'put',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: { jobId: '55' },
        query: {},
        body: {
          title: 'Retail Assistant',
          category: 'retail-assistant',
          jobType: 'full-time',
          location: 'Cape Town',
          isRemote: false,
          applicationDeadline: '',
          salaryMin: '',
          salaryMax: '',
          isSalaryNegotiable: true,
          description: 'Help customers on the shop floor.',
          responsibilities: '',
          requirements: '',
          companyName: 'Acme',
          companyLogo: null,
          companyBio: '',
          contactName: 'Employer User',
          contactEmail: 'employer@example.com',
          contactPhone: '',
          website: '',
          howToApply: 'email',
          applicationEmail: 'employer@example.com',
          applicationUrl: '',
          customInstructions: '',
          isConfidential: false,
          isDraft: false,
          screenerQuestions: [],
        },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.message).toMatch(/owned by your employer/i);
    expect(updateResults).toHaveLength(0);
  });

  it('scopes the employer job list to owned jobs', async () => {
    selectResults.push(
      [
        {
          id: 55,
          title: 'Owned job',
          location: 'Cape Town',
          jobType: 'full-time',
          companyId: 3,
          createdByUserId: 11,
          status: 'active',
          createdAt: new Date('2026-03-25T00:00:00Z'),
        },
        {
          id: 56,
          title: 'Other employer job',
          location: 'Durban',
          jobType: 'full-time',
          companyId: 3,
          createdByUserId: 99,
          status: 'active',
          createdAt: new Date('2026-03-24T00:00:00Z'),
        },
        {
          id: 57,
          title: 'Legacy unowned job',
          location: 'Pretoria',
          jobType: 'full-time',
          companyId: 3,
          createdByUserId: null,
          status: 'active',
          createdAt: new Date('2026-03-23T00:00:00Z'),
        },
      ],
      [{ id: 3, name: 'Acme' }],
      [],
      [],
    );

    const response = await invokeRoute({
      path: '/jobs',
      method: 'get',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: {},
        query: { status: 'all' },
        body: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe('55');
  });

  it('scopes the employer application list to owned jobs', async () => {
    selectResults.push(
      [
        { id: 100, userId: 7, jobId: 55, status: 'applied', appliedAt: new Date('2026-03-25T00:00:00Z'), notes: 'Owned application' },
        { id: 101, userId: 8, jobId: 56, status: 'applied', appliedAt: new Date('2026-03-24T00:00:00Z'), notes: 'Other application' },
      ],
      [{ id: 7, name: 'Candidate A', email: 'candidate-a@example.com' }],
      [
        { id: 55, title: 'Owned job', createdByUserId: 11 },
        { id: 56, title: 'Other employer job', createdByUserId: 99 },
      ],
    );

    const response = await invokeRoute({
      path: '/applications',
      method: 'get',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: {},
        query: {},
        body: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toEqual(expect.objectContaining({ id: '100', jobTitle: 'Owned job' }));
  });

  it('scopes employer dashboard metrics to owned jobs', async () => {
    selectResults.push(
      [
        { id: 55, title: 'Owned job', status: 'active', createdByUserId: 11, createdAt: new Date('2026-03-25T00:00:00Z') },
        { id: 56, title: 'Other employer job', status: 'active', createdByUserId: 99, createdAt: new Date('2026-03-24T00:00:00Z') },
        { id: 57, title: 'Legacy unowned job', status: 'active', createdByUserId: null, createdAt: new Date('2026-03-23T00:00:00Z') },
      ],
      [
        { id: 100, jobId: 55, appliedAt: new Date('2026-03-25T00:00:00Z') },
        { id: 101, jobId: 56, appliedAt: new Date('2026-03-24T00:00:00Z') },
        { id: 102, jobId: 57, appliedAt: new Date('2026-03-23T00:00:00Z') },
      ],
      [
        { id: 200, jobId: 55, interactionType: 'view', interactionTime: new Date('2026-03-25T00:00:00Z') },
        { id: 201, jobId: 56, interactionType: 'view', interactionTime: new Date('2026-03-24T00:00:00Z') },
        { id: 202, jobId: 57, interactionType: 'view', interactionTime: new Date('2026-03-23T00:00:00Z') },
      ],
    );

    const response = await invokeRoute({
      path: '/dashboard',
      method: 'get',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: {},
        query: {},
        body: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.stats).toEqual(expect.objectContaining({
      totalJobs: 1,
      totalApplications: 1,
      totalViews: 1,
    }));
  });
});
