import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  aiUsageEvents,
  billingPlans,
  billingSubscriptions,
  type BillingPlan,
  type BillingSubscription,
} from "@shared/schema";
import { featureFlagService } from "./featureFlagService";

export type AiDocumentType = "cv" | "cover_letter";

export type UserEntitlements = {
  canGenerateCv: boolean;
  canGenerateCoverLetter: boolean;
  hasUnlimitedAiCv: boolean;
  hasUnlimitedAiCoverLetters: boolean;
  adsEnabled: boolean;
  candidatePromotionLite: boolean;
  remainingFreeCvGenerations: number;
  remainingFreeCoverLetterGenerations: number;
  workwisePlusActive: boolean;
  gracePeriodEndsAt?: string | null;
};

type SubscriptionWithPlan = {
  subscription: BillingSubscription;
  plan: BillingPlan;
};

const FREE_LIMIT = 3;
const col = (column: unknown) => column as any;

function parseEntitlements(plan: BillingPlan | undefined): Record<string, any> {
  if (!plan?.entitlements) {
    return {};
  }

  if (typeof plan.entitlements === "string") {
    try {
      return JSON.parse(plan.entitlements);
    } catch {
      return {};
    }
  }

  return plan.entitlements as Record<string, any>;
}

function isSubscriptionUsable(subscription: BillingSubscription | undefined) {
  if (!subscription) {
    return false;
  }

  const now = Date.now();
  if (subscription.status === "active") {
    return !subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd).getTime() >= now;
  }

  if (subscription.status === "grace_period") {
    return Boolean(subscription.gracePeriodEndsAt && new Date(subscription.gracePeriodEndsAt).getTime() >= now);
  }

  return false;
}

export class EntitlementService {
  async getSuccessfulUsageCount(userId: number, documentType: AiDocumentType): Promise<number> {
    try {
      const [result] = await db
        .select({ total: count() })
        .from(aiUsageEvents)
        .where(and(
          eq(col(aiUsageEvents.userId), userId),
          eq(col(aiUsageEvents.documentType), documentType),
          eq(col(aiUsageEvents.success), true),
        ));

      return Number(result?.total || 0);
    } catch {
      return 0;
    }
  }

  private async getCurrentSubscription(userId: number): Promise<SubscriptionWithPlan | null> {
    try {
      const [record] = await db
        .select({
          subscription: billingSubscriptions,
          plan: billingPlans,
        })
        .from(billingSubscriptions)
        .innerJoin(billingPlans, eq(col(billingSubscriptions.planId), billingPlans.id))
        .where(eq(col(billingSubscriptions.userId), userId))
        .orderBy(desc(col(billingSubscriptions.createdAt)))
        .limit(1);

      return record ?? null;
    } catch {
      return null;
    }
  }

  async getEntitlementsForUser(userId?: number | null): Promise<UserEntitlements> {
    const flags = await featureFlagService.getFlags();

    if (!userId) {
      return {
        canGenerateCv: false,
        canGenerateCoverLetter: false,
        hasUnlimitedAiCv: false,
        hasUnlimitedAiCoverLetters: false,
        adsEnabled: true,
        candidatePromotionLite: false,
        remainingFreeCvGenerations: 0,
        remainingFreeCoverLetterGenerations: 0,
        workwisePlusActive: false,
      };
    }

    const [subscriptionWithPlan, cvUses, coverLetterUses] = await Promise.all([
      this.getCurrentSubscription(userId),
      this.getSuccessfulUsageCount(userId, "cv"),
      this.getSuccessfulUsageCount(userId, "cover_letter"),
    ]);

    const subscription = subscriptionWithPlan?.subscription;
    const plan = subscriptionWithPlan?.plan;
    const planEntitlements = parseEntitlements(plan);
    const hasUsableSubscription =
      flags.ENABLE_PLUS_SUBSCRIPTIONS &&
      isSubscriptionUsable(subscription) &&
      plan?.code === "workwise_plus";

    const hasUnlimitedAiCv = Boolean(hasUsableSubscription && planEntitlements.unlimitedAiCv);
    const hasUnlimitedAiCoverLetters = Boolean(hasUsableSubscription && planEntitlements.unlimitedAiCoverLetters);
    const remainingFreeCvGenerations = Math.max(0, FREE_LIMIT - cvUses);
    const remainingFreeCoverLetterGenerations = Math.max(0, FREE_LIMIT - coverLetterUses);

    return {
      canGenerateCv: flags.ENABLE_AI_CV && (hasUnlimitedAiCv || remainingFreeCvGenerations > 0),
      canGenerateCoverLetter: flags.ENABLE_AI_COVER_LETTER && (
        hasUnlimitedAiCoverLetters || remainingFreeCoverLetterGenerations > 0
      ),
      hasUnlimitedAiCv,
      hasUnlimitedAiCoverLetters,
      adsEnabled: flags.ENABLE_AD_SUPPRESSION ? !hasUsableSubscription : true,
      candidatePromotionLite: Boolean(hasUsableSubscription && planEntitlements.candidatePromotionLite),
      remainingFreeCvGenerations,
      remainingFreeCoverLetterGenerations,
      workwisePlusActive: hasUsableSubscription,
      gracePeriodEndsAt: subscription?.gracePeriodEndsAt?.toISOString?.() ?? null,
    };
  }
}

export const entitlementService = new EntitlementService();
