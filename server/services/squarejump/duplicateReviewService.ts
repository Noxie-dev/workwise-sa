import {
  jobDuplicateCandidates,
  jobSourceRecords,
  jobs,
  squareJumpAuditLog,
} from '@shared/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db';

export type DuplicateDecision = 'merge' | 'reject' | 'sibling';

export async function listDuplicateCandidates(status = 'pending', limit = 100) {
  const candidates = await db
    .select()
    .from(jobDuplicateCandidates)
    .where(eq(jobDuplicateCandidates.status, status))
    .orderBy(desc(jobDuplicateCandidates.confidence), desc(jobDuplicateCandidates.createdAt))
    .limit(Math.min(500, Math.max(1, limit)));

  const jobIds = new Set<number>();
  const sourceIds = new Set<number>();
  for (const candidate of candidates) {
    jobIds.add(candidate.jobId);
    if (candidate.candidateJobId) jobIds.add(candidate.candidateJobId);
    if (candidate.candidateSourceRecordId) sourceIds.add(candidate.candidateSourceRecordId);
  }
  const [candidateJobs, sourceRecords] = await Promise.all([
    jobIds.size ? db.select().from(jobs).where(inArray(jobs.id, [...jobIds])) : [],
    sourceIds.size
      ? db.select().from(jobSourceRecords).where(inArray(jobSourceRecords.id, [...sourceIds]))
      : [],
  ]);
  const jobsById = new Map(candidateJobs.map(job => [job.id, job]));
  const sourcesById = new Map(sourceRecords.map(source => [source.id, source]));

  return candidates.map(candidate => ({
    ...candidate,
    job: jobsById.get(candidate.jobId) ?? null,
    candidateJob: candidate.candidateJobId ? jobsById.get(candidate.candidateJobId) ?? null : null,
    candidateSource: candidate.candidateSourceRecordId
      ? sourcesById.get(candidate.candidateSourceRecordId) ?? null
      : null,
  }));
}

export async function resolveDuplicateCandidate(input: {
  candidateId: number;
  decision: DuplicateDecision;
  actorUserId: number;
  canonicalJobId?: number;
}) {
  return db.transaction(async transaction => {
    const [candidate] = await transaction
      .select()
      .from(jobDuplicateCandidates)
      .where(eq(jobDuplicateCandidates.id, input.candidateId));
    if (!candidate) throw new Error('Duplicate candidate not found');
    if (candidate.status !== 'pending') throw new Error('Duplicate candidate has already been resolved');

    let canonicalJobId = input.canonicalJobId ?? null;
    let sourceJobId: number | null = null;
    if (candidate.candidateSourceRecordId) {
      const [source] = await transaction
        .select({ jobId: jobSourceRecords.jobId })
        .from(jobSourceRecords)
        .where(eq(jobSourceRecords.id, candidate.candidateSourceRecordId));
      sourceJobId = source?.jobId ?? null;
      canonicalJobId ??= sourceJobId;
    }
    if (candidate.candidateJobId) canonicalJobId ??= candidate.candidateJobId;

    const now = new Date();
    const status = input.decision === 'merge' ? 'merged' : input.decision === 'reject' ? 'rejected' : 'sibling';
    if (input.decision === 'merge') {
      if (!canonicalJobId || canonicalJobId === candidate.jobId) {
        throw new Error('A different canonical job is required to merge this candidate');
      }
      await transaction
        .update(jobSourceRecords)
        .set({ jobId: canonicalJobId, ingestStatus: 'merged' })
        .where(eq(jobSourceRecords.jobId, candidate.jobId));
      await transaction
        .update(jobs)
        .set({ status: 'duplicate', riskStatus: 'penalised' })
        .where(eq(jobs.id, candidate.jobId));
    }

    const [resolved] = await transaction
      .update(jobDuplicateCandidates)
      .set({
        status,
        candidateJobId: canonicalJobId ?? candidate.candidateJobId,
        reviewedByUserId: input.actorUserId,
        reviewedAt: now,
      })
      .where(and(eq(jobDuplicateCandidates.id, input.candidateId), eq(jobDuplicateCandidates.status, 'pending')))
      .returning();

    await transaction.insert(squareJumpAuditLog).values({
      actorUserId: input.actorUserId,
      action: `duplicate.${input.decision}`,
      entityType: 'job_duplicate_candidate',
      entityId: String(input.candidateId),
      beforeState: candidate,
      afterState: resolved,
      metadata: {
        sourceJobId,
        canonicalJobId,
      },
      createdAt: now,
    });
    return resolved;
  });
}
