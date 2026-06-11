import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import {
  aiGeneratedDocuments,
  aiUsageEvents,
  type AiGeneratedDocument,
  type AiUsageEvent,
} from '@shared/schema';
import { Errors } from '../middleware/errorHandler';
import {
  entitlementService,
  type AiDocumentType,
  type UserEntitlements,
} from './entitlementService';

type Reservation = {
  usageEvent: AiUsageEvent;
  existingDocument?: AiGeneratedDocument;
  replay: boolean;
};

const col = (column: unknown) => column as any;

function capabilityFor(documentType: AiDocumentType, entitlements: UserEntitlements) {
  return documentType === 'cv' ? entitlements.canGenerateCv : entitlements.canGenerateCoverLetter;
}

export class AiUsageMeterService {
  async reserveUsage({
    userId,
    documentType,
    idempotencyKey,
    jobId,
    entitlements,
  }: {
    userId: number;
    documentType: AiDocumentType;
    idempotencyKey: string;
    jobId?: number;
    entitlements?: UserEntitlements;
  }): Promise<Reservation> {
    const resolvedEntitlements =
      entitlements ?? (await entitlementService.getEntitlementsForUser(userId));
    if (!capabilityFor(documentType, resolvedEntitlements)) {
      throw Errors.forbidden('AI generation quota exhausted or feature disabled');
    }

    const existing = await this.getUsageByIdempotencyKey(userId, idempotencyKey);
    if (existing) {
      const existingDocument = await this.getDocumentByUsageEvent(existing.id);
      return {
        usageEvent: existing,
        existingDocument,
        replay: true,
      };
    }

    try {
      const [usageEvent] = await db
        .insert(aiUsageEvents)
        .values({
          userId,
          documentType,
          jobId,
          idempotencyKey,
          status: 'started',
          success: false,
          tokens: 0,
          costEstimateCents: 0,
          generationTimeMs: 0,
        })
        .returning();

      return { usageEvent, replay: false };
    } catch (error) {
      const duplicate = await this.getUsageByIdempotencyKey(userId, idempotencyKey);
      if (duplicate) {
        return {
          usageEvent: duplicate,
          existingDocument: await this.getDocumentByUsageEvent(duplicate.id),
          replay: true,
        };
      }

      throw error;
    }
  }

  async completeUsage({
    usageEventId,
    model,
    tokens,
    costEstimateCents,
    generationTimeMs,
    metadata,
  }: {
    usageEventId: number;
    model?: string;
    tokens?: number;
    costEstimateCents?: number;
    generationTimeMs: number;
    metadata?: Record<string, unknown>;
  }) {
    const [usageEvent] = await db
      .update(aiUsageEvents)
      .set({
        model,
        tokens: tokens ?? 0,
        costEstimateCents: costEstimateCents ?? 0,
        generationTimeMs,
        metadata,
        success: true,
        status: 'succeeded',
        completedAt: new Date(),
      })
      .where(eq(col(aiUsageEvents.id), usageEventId))
      .returning();

    return usageEvent;
  }

  async failUsage(usageEventId: number, errorMessage: string, generationTimeMs = 0) {
    const [usageEvent] = await db
      .update(aiUsageEvents)
      .set({
        success: false,
        status: 'failed',
        errorMessage,
        generationTimeMs,
        completedAt: new Date(),
      })
      .where(eq(col(aiUsageEvents.id), usageEventId))
      .returning();

    return usageEvent;
  }

  async createGeneratedDocument({
    userId,
    usageEventId,
    documentType,
    jobId,
    title,
    content,
    model,
  }: {
    userId: number;
    usageEventId: number;
    documentType: AiDocumentType;
    jobId?: number;
    title?: string;
    content: Record<string, unknown>;
    model?: string;
  }) {
    const [document] = await db
      .insert(aiGeneratedDocuments)
      .values({
        userId,
        usageEventId,
        documentType,
        jobId,
        title,
        content,
        model,
      })
      .returning();

    return document;
  }

  async getUsageByIdempotencyKey(userId: number, idempotencyKey: string) {
    const [usageEvent] = await db
      .select()
      .from(aiUsageEvents)
      .where(
        and(
          eq(col(aiUsageEvents.userId), userId),
          eq(col(aiUsageEvents.idempotencyKey), idempotencyKey)
        )
      )
      .limit(1);

    return usageEvent;
  }

  async getDocumentByUsageEvent(usageEventId: number) {
    const [document] = await db
      .select()
      .from(aiGeneratedDocuments)
      .where(eq(col(aiGeneratedDocuments.usageEventId), usageEventId))
      .limit(1);

    return document;
  }
}

export const aiUsageMeterService = new AiUsageMeterService();
