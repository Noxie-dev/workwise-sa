import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/jobIngestionService', () => ({
  ingestJobs: vi.fn(),
}));

import { ingestJobs } from '../../services/jobIngestionService';
import v1Router from '../../routes/v1';

const mockedIngestJobs = vi.mocked(ingestJobs);

function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(v1Router);
  return app;
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

    const response = await request(createApp())
      .post('/jobs/ingest')
      .send([buildJob()]);

    expect(response.status).toBe(200);
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

    const response = await request(createApp())
      .post('/jobs/ingest')
      .send([buildJob()]);

    expect(response.status).toBe(200);
    expect(response.body.duplicates).toBe(1);
  });

  it('rejects missing required fields', async () => {
    const invalidJob = buildJob();
    delete (invalidJob as { companyName?: string }).companyName;

    const response = await request(createApp())
      .post('/jobs/ingest')
      .send([invalidJob]);

    expect(response.status).toBe(400);
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

    const response = await request(createApp())
      .post('/jobs/ingest')
      .send(batch);

    expect(response.status).toBe(413);
    expect(response.body.message).toContain('maximum of 500');
    expect(mockedIngestJobs).not.toHaveBeenCalled();
  });
});
