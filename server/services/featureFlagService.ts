import { eq } from "drizzle-orm";
import { db } from "../db";
import { systemConfig } from "@shared/schema";

export type MonetizationFeatureFlag =
  | "ENABLE_PLUS_SUBSCRIPTIONS"
  | "ENABLE_AI_CV"
  | "ENABLE_AI_COVER_LETTER"
  | "ENABLE_PAYFAST"
  | "ENABLE_AD_SUPPRESSION";

const DEFAULT_FLAGS: Record<MonetizationFeatureFlag, boolean> = {
  ENABLE_PLUS_SUBSCRIPTIONS: true,
  ENABLE_AI_CV: true,
  ENABLE_AI_COVER_LETTER: true,
  ENABLE_PAYFAST: true,
  ENABLE_AD_SUPPRESSION: true,
};

const col = (column: unknown) => column as any;

function parseFlag(value: string | null | undefined, fallback: boolean) {
  if (typeof value !== "string") {
    return fallback;
  }

  return ["1", "true", "yes", "on", "enabled"].includes(value.toLowerCase());
}

export class FeatureFlagService {
  async isEnabled(key: MonetizationFeatureFlag): Promise<boolean> {
    try {
      const [record] = await db.select().from(systemConfig).where(eq(col(systemConfig.key), key));
      return parseFlag(record?.value, DEFAULT_FLAGS[key]);
    } catch (error) {
      return DEFAULT_FLAGS[key];
    }
  }

  async getFlags(): Promise<Record<MonetizationFeatureFlag, boolean>> {
    const entries = await Promise.all(
      (Object.keys(DEFAULT_FLAGS) as MonetizationFeatureFlag[]).map(async (key) => [
        key,
        await this.isEnabled(key),
      ] as const),
    );

    return Object.fromEntries(entries) as Record<MonetizationFeatureFlag, boolean>;
  }
}

export const featureFlagService = new FeatureFlagService();
