import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../../db', () => ({
  db: mockDb,
}));

vi.mock('../../services/candidatePromotionService', () => ({
  candidatePromotionService: {
    upsertPromotionForUser: vi.fn(),
  },
}));

import { BillingService } from '../../services/billingService';

function setupDb({
  selectResults = [],
  insertResults = [],
}: {
  selectResults?: unknown[][];
  insertResults?: unknown[][];
} = {}) {
  const queuedSelects = [...selectResults];
  const queuedInserts = [...insertResults];
  const updateSetCalls: Record<string, unknown>[] = [];

  mockDb.select.mockImplementation(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn().mockImplementation(async () => queuedSelects.shift() ?? []),
        orderBy: vi.fn(() => ({
          limit: vi.fn().mockImplementation(async () => queuedSelects.shift() ?? []),
        })),
      })),
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockImplementation(async () => queuedSelects.shift() ?? []),
          })),
        })),
      })),
    })),
  }));

  mockDb.insert.mockImplementation(() => ({
    values: vi.fn(() => ({
      returning: vi.fn().mockImplementation(async () => queuedInserts.shift() ?? [{ id: 1 }]),
    })),
  }));

  mockDb.update.mockImplementation(() => ({
    set: vi.fn((values: Record<string, unknown>) => {
      updateSetCalls.push(values);
      return {
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 1, ...values }]),
        })),
      };
    }),
  }));

  return { updateSetCalls };
}

describe('BillingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores duplicate processed PayFast ITNs', async () => {
    setupDb({
      selectResults: [[{ id: 11, processedAt: new Date() }]],
    });
    const service = new BillingService();
    (service as any).verifyPayfastPayload = vi.fn();

    const result = await service.handlePayfastItn({
      pf_payment_id: 'pf-dup',
      m_payment_id: 'ww-plus-7',
      payment_status: 'COMPLETE',
      signature: 'valid',
    });

    expect(result).toEqual({ duplicate: true, processed: true });
    expect((service as any).verifyPayfastPayload).not.toHaveBeenCalled();
  });

  it('rejects invalid PayFast signatures before activating subscriptions', async () => {
    setupDb({
      selectResults: [[]],
      insertResults: [[{ id: 12 }]],
    });
    const service = new BillingService();
    (service as any).verifyPayfastPayload = vi.fn().mockResolvedValue(false);
    (service as any).activateSubscription = vi.fn();

    await expect(
      service.handlePayfastItn({
        pf_payment_id: 'pf-invalid',
        m_payment_id: 'ww-plus-7',
        payment_status: 'COMPLETE',
        signature: 'invalid',
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect((service as any).activateSubscription).not.toHaveBeenCalled();
  });

  it('activates Plus only after a verified successful PayFast ITN', async () => {
    const { updateSetCalls } = setupDb({
      selectResults: [[], [{ id: 21, userId: 7, planId: 2 }]],
      insertResults: [[{ id: 13 }]],
    });
    const service = new BillingService();
    (service as any).verifyPayfastPayload = vi.fn().mockResolvedValue(true);
    (service as any).activateSubscription = vi.fn().mockResolvedValue({ id: 31 });

    const result = await service.handlePayfastItn({
      pf_payment_id: 'pf-success',
      m_payment_id: 'ww-plus-7',
      payment_status: 'COMPLETE',
      token: 'payfast-token',
      signature: 'valid',
    });

    expect(result).toEqual({ duplicate: false, processed: true });
    expect((service as any).activateSubscription).toHaveBeenCalledWith({
      userId: 7,
      planId: 2,
      providerPaymentId: 'pf-success',
      providerToken: 'payfast-token',
      transactionId: 21,
    });
    expect(updateSetCalls.at(-1)).toMatchObject({ verified: true });
    expect(updateSetCalls.at(-1)?.processedAt).toBeInstanceOf(Date);
  });

  it('routes failed PayFast payments into the failure path', async () => {
    setupDb({
      selectResults: [[], [{ id: 22, userId: 7, planId: 2 }]],
      insertResults: [[{ id: 14 }]],
    });
    const service = new BillingService();
    (service as any).verifyPayfastPayload = vi.fn().mockResolvedValue(true);
    (service as any).markPaymentFailed = vi.fn().mockResolvedValue(undefined);

    await service.handlePayfastItn({
      pf_payment_id: 'pf-failed',
      m_payment_id: 'ww-plus-7',
      payment_status: 'FAILED',
      signature: 'valid',
    });

    expect((service as any).markPaymentFailed).toHaveBeenCalledWith(7, 22, 'FAILED');
  });

  it('moves active subscriptions into a 7-day grace period after payment failure', async () => {
    const { updateSetCalls } = setupDb();
    const service = new BillingService();
    (service as any).getCurrentSubscription = vi.fn().mockResolvedValue({
      id: 32,
      status: 'active',
    });

    await (service as any).markPaymentFailed(7, 22, 'FAILED');

    expect(updateSetCalls[0]).toMatchObject({
      status: 'failed',
      metadata: { payfastStatus: 'FAILED' },
    });
    expect(updateSetCalls[1]).toMatchObject({ status: 'grace_period' });
    expect(updateSetCalls[1].gracePeriodEndsAt).toBeInstanceOf(Date);
    const graceMs = (updateSetCalls[1].gracePeriodEndsAt as Date).getTime() - Date.now();
    expect(graceMs).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(graceMs).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });
});
