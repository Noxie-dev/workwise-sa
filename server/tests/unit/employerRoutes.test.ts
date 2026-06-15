import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectResults: any[] = [];
const insertResults: any[] = [];
const updateResults: any[] = [];

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => {
        const query = {
          where: vi.fn(() => ({
            limit: vi.fn(async () => selectResults.shift() ?? []),
          })),
          orderBy: vi.fn(async () => selectResults.shift() ?? []),
          then: vi.fn((resolve: (value: unknown) => unknown) =>
            Promise.resolve(resolve(selectResults.shift() ?? []))
          ),
        };
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
  method: 'get' | 'post' | 'patch';
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
      [
        {
          id: 4,
          name: 'Retail Assistant',
          slug: 'retail-assistant',
          icon: 'briefcase',
          jobCount: 0,
        },
      ],
      [
        {
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
          ownerUserId: 11,
          createdAt: new Date('2026-03-25T00:00:00Z'),
        },
      ]
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
    expect(response.body.ownerUserId).toBe(11);
  });

  it('updates a job status', async () => {
    selectResults.push([{ id: 55, ownerUserId: 11, status: 'active' }]);
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

  it('scopes dashboard data to the authenticated employer', async () => {
    const now = new Date();
    selectResults.push(
      [
        {
          id: 55,
          title: 'Owned Job',
          status: 'active',
          ownerUserId: 11,
          createdAt: now,
        },
        {
          id: 66,
          title: 'Other Employer Job',
          status: 'active',
          ownerUserId: 22,
          createdAt: now,
        },
      ],
      [
        { id: 1, jobId: 55, appliedAt: now },
        { id: 2, jobId: 66, appliedAt: now },
      ],
      [
        { id: 1, jobId: 55, interactionType: 'view', interactionTime: now },
        { id: 2, jobId: 66, interactionType: 'view', interactionTime: now },
      ]
    );

    const response = await invokeRoute({
      path: '/dashboard',
      method: 'get',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: {},
        query: { status: 'all', dateRange: '30d' },
        body: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.scope).toBe('employer');
    expect(response.body.stats).toEqual({
      totalJobs: 1,
      activeJobs: 1,
      totalApplications: 1,
      totalViews: 1,
    });
    expect(response.body.charts.jobPerformance).toEqual([
      { jobTitle: 'Owned Job', views: 1, applications: 1 },
    ]);
  });

  it('allows admins to see platform-wide dashboard data', async () => {
    mockedResolveAuthenticatedDatabaseUser.mockResolvedValueOnce({
      id: 99,
      role: 'admin',
      email: 'admin@example.com',
      name: 'Admin User',
    } as any);

    const now = new Date();
    selectResults.push(
      [
        { id: 55, title: 'Owned Job', status: 'active', ownerUserId: 11, createdAt: now },
        { id: 66, title: 'Other Job', status: 'paused', ownerUserId: 22, createdAt: now },
      ],
      [
        { id: 1, jobId: 55, appliedAt: now },
        { id: 2, jobId: 66, appliedAt: now },
      ],
      [
        { id: 1, jobId: 55, interactionType: 'view', interactionTime: now },
        { id: 2, jobId: 66, interactionType: 'view', interactionTime: now },
      ]
    );

    const response = await invokeRoute({
      path: '/dashboard',
      method: 'get',
      req: {
        user: { uid: 'firebase-admin-1' },
        params: {},
        query: { status: 'all', dateRange: '30d' },
        body: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.scope).toBe('platform');
    expect(response.body.stats.totalJobs).toBe(2);
    expect(response.body.stats.totalApplications).toBe(2);
  });

  it('prevents employers from changing another employer job status', async () => {
    selectResults.push([{ id: 55, ownerUserId: 22, status: 'active' }]);

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
    expect(response.body.error.message).toBe('You do not have permission to manage this job');
  });

  it('scopes applications to owned jobs and selected job filter', async () => {
    const now = new Date();
    selectResults.push(
      [
        { id: 1, userId: 100, jobId: 55, status: 'applied', appliedAt: now, notes: null },
        { id: 2, userId: 101, jobId: 66, status: 'applied', appliedAt: now, notes: null },
        { id: 3, userId: 102, jobId: 77, status: 'applied', appliedAt: now, notes: null },
      ],
      [
        { id: 100, name: 'Owned Applicant', email: 'owned@example.com' },
        { id: 101, name: 'Other Applicant', email: 'other@example.com' },
        { id: 102, name: 'Second Owned Applicant', email: 'second@example.com' },
      ],
      [
        { id: 55, title: 'Selected Job', status: 'active', ownerUserId: 11 },
        { id: 66, title: 'Other Job', status: 'active', ownerUserId: 22 },
        { id: 77, title: 'Second Owned Job', status: 'active', ownerUserId: 11 },
      ]
    );

    const response = await invokeRoute({
      path: '/applications',
      method: 'get',
      req: {
        user: { uid: 'firebase-employer-1' },
        params: {},
        query: { jobId: '55', status: 'all', dateRange: '30d' },
        body: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      {
        id: '1',
        applicantName: 'Owned Applicant',
        applicantEmail: 'owned@example.com',
        jobTitle: 'Selected Job',
        status: 'applied',
        appliedAt: now,
        notes: null,
      },
    ]);
  });
});
