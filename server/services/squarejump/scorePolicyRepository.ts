import { jobScores, scorePolicies, squareJumpAuditLog } from '@shared/schema';
import type { PolicySimulationInput } from '@shared/squarejump-contracts';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';

export function numericPolicyWeights(
  value: unknown,
  fallback: Record<string, number>,
): Record<string, number> {
  if (typeof value === 'string') {
    try {
      return numericPolicyWeights(JSON.parse(value), fallback);
    } catch {
      return { ...fallback };
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...fallback };
  const candidate = value as Record<string, unknown>;
  const result = { ...fallback };
  for (const key of Object.keys(fallback)) {
    if (typeof candidate[key] === 'number' && Number.isFinite(candidate[key]) && candidate[key] >= 0) {
      result[key] = candidate[key];
    }
  }
  return result;
}

export function validatePolicyWeights(policy: PolicySimulationInput) {
  const total = Object.values(policy.weights).reduce((sum, weight) => sum + weight, 0);
  const valid = Math.abs(total - 100) < 0.001;
  const requiredKeys: Record<PolicySimulationInput['policyType'], string[]> = {
    opportunity: ['listingQuality', 'employerTrust', 'freshness', 'engagementQuality', 'applicationPerformance', 'sourceReliability', 'marketSignal'],
    match: ['category', 'location', 'requirements', 'skills', 'employmentType', 'salary', 'behavioural', 'exploration'],
    placement: ['match', 'opportunity', 'freshness', 'session', 'exploration'],
    release: [],
  };
  const missingKeys = requiredKeys[policy.policyType].filter(key => typeof policy.weights[key] !== 'number');
  const structurallyValid = missingKeys.length === 0;
  return {
    valid: valid && structurallyValid,
    total,
    missingKeys,
    message: valid
      ? structurallyValid ? null : `Policy is missing required weights: ${missingKeys.join(', ')}`
      : 'Policy weights must total 100',
  };
}

export async function getActivePolicy(policyType: string) {
  const [policy] = await db
    .select()
    .from(scorePolicies)
    .where(and(eq(scorePolicies.policyType, policyType), eq(scorePolicies.status, 'active')));
  return policy;
}

export async function saveDraftPolicy(policy: PolicySimulationInput, createdByUserId: number) {
  const validation = validatePolicyWeights(policy);
  if (!validation.valid) throw new Error(validation.message ?? 'Invalid policy');
  const [created] = await db
    .insert(scorePolicies)
    .values({
      policyType: policy.policyType,
      version: policy.version,
      status: 'simulated',
      weights: policy.weights,
      thresholds: policy.thresholds,
      createdByUserId,
      createdAt: new Date(),
    })
    .returning();
  return created;
}

function parseObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return parseObject(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function simulatePolicyImpact(policy: PolicySimulationInput) {
  if (policy.policyType !== 'opportunity') {
    return {
      sampledRecordCount: 0,
      changedScoreCount: 0,
      belowReleaseThresholdCount: null,
      note: 'Impact replay is currently implemented for opportunity scores; other policy types are validated and staged for activation.',
    };
  }

  const records = await db
    .select({ scoreValue: jobScores.scoreValue, components: jobScores.componentScores })
    .from(jobScores)
    .where(eq(jobScores.scoreType, 'opportunity'));
  const threshold = typeof policy.thresholds.minimumReleaseScore === 'number'
    ? policy.thresholds.minimumReleaseScore
    : null;
  let changedScoreCount = 0;
  let belowReleaseThresholdCount = 0;
  for (const record of records) {
    const components = parseObject(record.components);
    const projected = Object.entries(policy.weights).reduce((sum, [key, weight]) => {
      const component = typeof components[key] === 'number' ? components[key] as number : 0;
      return sum + component * weight / 100;
    }, 0);
    const projectedScore = Math.round(Math.max(0, Math.min(100, projected)));
    if (projectedScore !== record.scoreValue) changedScoreCount += 1;
    if (threshold != null && projectedScore < threshold) belowReleaseThresholdCount += 1;
  }
  return {
    sampledRecordCount: records.length,
    changedScoreCount,
    belowReleaseThresholdCount: threshold == null ? null : belowReleaseThresholdCount,
    note: 'Replay uses persisted component snapshots and is suitable for staging comparison before activation.',
  };
}

export async function activatePolicy(policyId: number, actorUserId: number) {
  return db.transaction(async (transaction: typeof db) => {
    const [target] = await transaction
      .select()
      .from(scorePolicies)
      .where(eq(scorePolicies.id, policyId));
    if (!target) throw new Error('Score policy not found');
    if (!['draft', 'simulated', 'approved'].includes(target.status)) {
      throw new Error(`Policy in '${target.status}' state cannot be activated`);
    }

    const [current] = await transaction
      .select()
      .from(scorePolicies)
      .where(
        and(eq(scorePolicies.policyType, target.policyType), eq(scorePolicies.status, 'active'))
      );
    const now = new Date();
    if (current) {
      await transaction
        .update(scorePolicies)
        .set({
          status: 'retired',
          retiredAt: now,
        })
        .where(eq(scorePolicies.id, current.id));
    }
    const [activated] = await transaction
      .update(scorePolicies)
      .set({
        status: 'active',
        approvedAt: target.approvedAt ?? now,
        activatedAt: now,
      })
      .where(eq(scorePolicies.id, target.id))
      .returning();
    await transaction.insert(squareJumpAuditLog).values({
      actorUserId,
      action: 'policy.activate',
      entityType: 'score_policy',
      entityId: String(target.id),
      beforeState: target,
      afterState: activated,
      metadata: { retiredPolicyId: current?.id ?? null },
      createdAt: now,
    });
    return activated;
  });
}

export async function rollbackPolicy(policyId: number, actorUserId: number) {
  return db.transaction(async (transaction: typeof db) => {
    const [target] = await transaction
      .select()
      .from(scorePolicies)
      .where(eq(scorePolicies.id, policyId));
    if (!target) throw new Error('Score policy not found');
    if (target.status !== 'retired') throw new Error('Only a retired policy can be restored');

    const [current] = await transaction
      .select()
      .from(scorePolicies)
      .where(and(eq(scorePolicies.policyType, target.policyType), eq(scorePolicies.status, 'active')));
    const now = new Date();
    if (current) {
      await transaction.update(scorePolicies).set({ status: 'retired', retiredAt: now }).where(eq(scorePolicies.id, current.id));
    }
    const [restored] = await transaction
      .update(scorePolicies)
      .set({ status: 'active', activatedAt: now, retiredAt: null })
      .where(eq(scorePolicies.id, target.id))
      .returning();
    await transaction.insert(squareJumpAuditLog).values({
      actorUserId,
      action: 'policy.rollback',
      entityType: 'score_policy',
      entityId: String(target.id),
      beforeState: target,
      afterState: restored,
      metadata: { replacedPolicyId: current?.id ?? null },
      createdAt: now,
    });
    return restored;
  });
}
