import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/jobIngestionService', () => ({
  ingestJobs: vi.fn(),
}));

import { ingestJobs } from '../../services/jobIngestionService';
import v1Router from '../../routes/v1';

const mockedIngestJobs = vi.mocked(ingestJobs);

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

function getRouteHandler(path: string, method: 'post') {
  const layer = v1Router.stack.find(
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method],
  );

  if (!layer) {
    throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle;
}

async function invokeRoute({
  path,
  method,
  req,
}: {
  path: string;
  method: 'post';
  req: Record<string, any>;
}) {
  const handler = getRouteHandler(path, method);
  const response = createMockResponse();

  await handler(req, response);

  return response;
}

function buildJob(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Cashier',
    description: 'Front of store cashier role',
    companyName: 'Example Retail',
    location: 'Cape Town',
    salaryText: 'R5000 pm',
    jobType: 'Full-time',
    workMode: 'On-site',
    sourceSite: 'gumtree',
    sourceUrl: 'https://example.com/jobs/1234567890',
    externalId: '1234567890',
    postedAt: '2026-03-24T00:00:00.000Z',
    applyUrl: 'https://example.com/jobs/1234567890',
    metadata: {
      isAnonymized: true,
      complianceVersion: 'POPIA_v1',
    },
    ...overrides,
  };
}

describe('job ingest routes', () => {
  beforeEach(() => {
    mockedIngestJobs.mockReset();
    delete process.env.SCRAPING_INGEST_TOKEN;
  });

  it('accepts a valid payload', async () => {
    mockedIngestJobs.mockResolvedValue({
      inserted: 1,
      duplicates: 0,
      failed: 0,
      errors: [],
    });

    const response = await invokeRoute({
      path: '/jobs/ingest',
      method: 'post',
      req: {
        body: [buildJob()],
        headers: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      inserted: 1,
      duplicates: 0,
      failed: 0,
      errors: [],
    });
    expect(mockedIngestJobs).toHaveBeenCalledTimes(1);
  });

  it('reports duplicates from the ingestion service', async () => {
    mockedIngestJobs.mockResolvedValue({
      inserted: 0,
      duplicates: 1,
      failed: 0,
      errors: [],
    });

    const response = await invokeRoute({
      path: '/jobs/ingest',
      method: 'post',
      req: {
        body: [buildJob()],
        headers: {},
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.duplicates).toBe(1);
  });

  it('rejects missing required fields', async () => {
    const invalidJob = buildJob();
    delete (invalidJob as { companyName?: string }).companyName;

    const response = await invokeRoute({
      path: '/jobs/ingest',
      method: 'post',
      req: {
        body: [invalidJob],
        headers: {},
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Invalid ingestion payload');
    expect(mockedIngestJobs).not.toHaveBeenCalled();
  });

  it('rejects batches larger than 500 jobs', async () => {
    const batch = Array.from({ length: 501 }, (_, index) =>
      buildJob({
        externalId: `job-${index}`,
        sourceUrl: `https://example.com/jobs/${index}`,
        applyUrl: `https://example.com/jobs/${index}`,
      })
    );

    const response = await invokeRoute({
      path: '/jobs/ingest',
      method: 'post',
      req: {
        body: batch,
        headers: {},
      },
    });

    expect(response.statusCode).toBe(413);
    expect(response.body.message).toContain('maximum of 500');
    expect(mockedIngestJobs).not.toHaveBeenCalled();
  });
});
