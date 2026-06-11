import { describe, expect, it, vi } from 'vitest';
import { AiUsageMeterService } from '../../services/aiUsageMeterService';

const baseEntitlements = {
  canGenerateCv: true,
  canGenerateCoverLetter: true,
  hasUnlimitedAiCv: false,
  hasUnlimitedAiCoverLetters: false,
  adsEnabled: true,
  candidatePromotionLite: false,
  remainingFreeCvGenerations: 1,
  remainingFreeCoverLetterGenerations: 1,
  workwisePlusActive: false,
};

describe('AiUsageMeterService', () => {
  it('rejects exhausted quota before creating or replaying usage', async () => {
    const service = new AiUsageMeterService();
    const usageLookup = vi.fn();
    (service as any).getUsageByIdempotencyKey = usageLookup;

    await expect(
      service.reserveUsage({
        userId: 7,
        documentType: 'cv',
        idempotencyKey: 'quota-exhausted',
        entitlements: {
          ...baseEntitlements,
          canGenerateCv: false,
          remainingFreeCvGenerations: 0,
        },
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(usageLookup).not.toHaveBeenCalled();
  });

  it('returns existing usage and document for idempotent retries', async () => {
    const service = new AiUsageMeterService();
    (service as any).getUsageByIdempotencyKey = vi.fn().mockResolvedValue({
      id: 101,
      userId: 7,
      documentType: 'cover_letter',
      idempotencyKey: 'retry-key',
      success: true,
    });
    (service as any).getDocumentByUsageEvent = vi.fn().mockResolvedValue({
      id: 202,
      usageEventId: 101,
      content: { text: 'Existing cover letter' },
    });

    const reservation = await service.reserveUsage({
      userId: 7,
      documentType: 'cover_letter',
      idempotencyKey: 'retry-key',
      jobId: 42,
      entitlements: baseEntitlements,
    });

    expect(reservation).toMatchObject({
      replay: true,
      usageEvent: { id: 101 },
      existingDocument: { id: 202 },
    });
  });
});
