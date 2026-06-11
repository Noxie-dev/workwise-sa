import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntitlementService, type AiDocumentType } from '../../services/entitlementService';
import { featureFlagService } from '../../services/featureFlagService';

const defaultFlags = {
  ENABLE_PLUS_SUBSCRIPTIONS: true,
  ENABLE_AI_CV: true,
  ENABLE_AI_COVER_LETTER: true,
  ENABLE_PAYFAST: true,
  ENABLE_AD_SUPPRESSION: true,
};

const plusPlan = {
  id: 2,
  code: 'workwise_plus',
  entitlements: {
    unlimitedAiCv: true,
    unlimitedAiCoverLetters: true,
    candidatePromotionLite: true,
  },
};

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function makeService({
  subscription,
  cvUses = 0,
  coverLetterUses = 0,
}: {
  subscription?: Record<string, unknown> | null;
  cvUses?: number;
  coverLetterUses?: number;
}) {
  const service = new EntitlementService();
  (service as any).getCurrentSubscription = vi
    .fn()
    .mockResolvedValue(subscription ? { subscription, plan: plusPlan } : null);
  vi.spyOn(service, 'getSuccessfulUsageCount').mockImplementation(
    async (_userId: number, documentType: AiDocumentType) =>
      documentType === 'cv' ? cvUses : coverLetterUses
  );
  return service;
}

describe('EntitlementService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(featureFlagService, 'getFlags').mockResolvedValue(defaultFlags);
  });

  it('returns free usage capabilities until the free quota is exhausted', async () => {
    const service = makeService({ cvUses: 2, coverLetterUses: 3 });

    const entitlements = await service.getEntitlementsForUser(9);

    expect(entitlements.canGenerateCv).toBe(true);
    expect(entitlements.remainingFreeCvGenerations).toBe(1);
    expect(entitlements.canGenerateCoverLetter).toBe(false);
    expect(entitlements.remainingFreeCoverLetterGenerations).toBe(0);
    expect(entitlements.workwisePlusActive).toBe(false);
  });

  it('grants unlimited AI, ad suppression, and promotion while Plus is active', async () => {
    const service = makeService({
      subscription: {
        id: 12,
        status: 'active',
        currentPeriodEnd: daysFromNow(20),
      },
      cvUses: 8,
      coverLetterUses: 9,
    });

    const entitlements = await service.getEntitlementsForUser(9);

    expect(entitlements).toMatchObject({
      canGenerateCv: true,
      canGenerateCoverLetter: true,
      hasUnlimitedAiCv: true,
      hasUnlimitedAiCoverLetters: true,
      adsEnabled: false,
      candidatePromotionLite: true,
      workwisePlusActive: true,
      remainingFreeCvGenerations: 0,
    });
  });

  it('keeps Plus capabilities during the subscription grace period', async () => {
    const gracePeriodEndsAt = daysFromNow(7);
    const service = makeService({
      subscription: {
        id: 13,
        status: 'grace_period',
        gracePeriodEndsAt,
      },
      cvUses: 5,
      coverLetterUses: 5,
    });

    const entitlements = await service.getEntitlementsForUser(9);

    expect(entitlements.workwisePlusActive).toBe(true);
    expect(entitlements.canGenerateCv).toBe(true);
    expect(entitlements.gracePeriodEndsAt).toBe(gracePeriodEndsAt.toISOString());
  });

  it('does not treat cancelled or expired subscriptions as usable', async () => {
    const cancelled = makeService({
      subscription: {
        id: 14,
        status: 'cancelled',
        currentPeriodEnd: daysFromNow(20),
      },
      cvUses: 3,
      coverLetterUses: 3,
    });
    const expired = makeService({
      subscription: {
        id: 15,
        status: 'active',
        currentPeriodEnd: daysFromNow(-1),
      },
      cvUses: 3,
      coverLetterUses: 3,
    });

    await expect(cancelled.getEntitlementsForUser(9)).resolves.toMatchObject({
      canGenerateCv: false,
      workwisePlusActive: false,
      adsEnabled: true,
    });
    await expect(expired.getEntitlementsForUser(9)).resolves.toMatchObject({
      canGenerateCv: false,
      workwisePlusActive: false,
      adsEnabled: true,
    });
  });

  it('lets runtime feature flags disable Plus and AI capabilities', async () => {
    vi.spyOn(featureFlagService, 'getFlags').mockResolvedValue({
      ...defaultFlags,
      ENABLE_PLUS_SUBSCRIPTIONS: false,
      ENABLE_AI_CV: false,
      ENABLE_AI_COVER_LETTER: false,
    });
    const service = makeService({
      subscription: {
        id: 16,
        status: 'active',
        currentPeriodEnd: daysFromNow(20),
      },
    });

    const entitlements = await service.getEntitlementsForUser(9);

    expect(entitlements).toMatchObject({
      canGenerateCv: false,
      canGenerateCoverLetter: false,
      hasUnlimitedAiCv: false,
      hasUnlimitedAiCoverLetters: false,
      workwisePlusActive: false,
      adsEnabled: true,
    });
  });
});
