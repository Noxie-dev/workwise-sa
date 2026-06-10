import { eq } from "drizzle-orm";
import { db } from "../db";
import { candidatePromotionState } from "@shared/schema";
import { storage } from "../storage";

const col = (column: unknown) => column as any;

function hasValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

export class CandidatePromotionService {
  calculateProfileStrength(profile: any): number {
    const checks = [
      hasValue(profile?.personal?.fullName),
      hasValue(profile?.personal?.phoneNumber),
      hasValue(profile?.personal?.location),
      hasValue(profile?.personal?.bio),
      hasValue(profile?.education?.highestEducation) || hasValue(profile?.education?.schoolName),
      hasValue(profile?.experience?.jobTitle) || hasValue(profile?.experience?.previousExperience),
      hasValue(profile?.skills?.skills),
      hasValue(profile?.skills?.languages),
      Boolean(profile?.skills?.cvUpload),
      Boolean(profile?.personal?.profilePicture || profile?.personal?.professionalImage),
    ];

    const complete = checks.filter(Boolean).length;
    return Math.round((complete / checks.length) * 100);
  }

  async upsertPromotionForUser(userId: number, active: boolean) {
    const profile = await storage.getUserProfile(userId);
    const profileStrength = this.calculateProfileStrength(profile);
    const baseBoost = active ? 15 : 0;
    const boostScore = active ? Math.min(100, baseBoost + Math.round(profileStrength * 0.35)) : 0;
    const visibilityMultiplier = active ? 115 : 100;

    const [existing] = await db
      .select()
      .from(candidatePromotionState)
      .where(eq(col(candidatePromotionState.userId), userId))
      .limit(1);

    const values = {
      boostScore,
      visibilityMultiplier,
      profileStrength,
      active,
      source: active ? "workwise_plus" : "system",
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await db.update(candidatePromotionState)
        .set(values)
        .where(eq(col(candidatePromotionState.userId), userId))
        .returning();

      return updated;
    }

    const [created] = await db.insert(candidatePromotionState)
      .values({
        userId,
        ...values,
      })
      .returning();

    return created;
  }
}

export const candidatePromotionService = new CandidatePromotionService();
