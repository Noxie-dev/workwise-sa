import crypto from 'crypto';
import type { JobIngest } from '@shared/job-ingest-schema';

export type JobFingerprints = {
  exact: string;
  content: string;
  normalisedPayload: string;
};

export type DuplicateEvidence = {
  externalIdMatches: boolean;
  applicationUrlMatches: boolean;
  exactFingerprintMatches: boolean;
  contentFingerprintMatches: boolean;
  organisationMatches: boolean;
  locationMatches: boolean;
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\b(?:pty|ltd|limited|inc|llc)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeUrl(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key =>
      url.searchParams.delete(key)
    );
    return url.toString().replace(/\/$/, '');
  } catch {
    return normalizeText(value);
  }
}

function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function buildFingerprints(job: JobIngest): JobFingerprints {
  const organisation = normalizeText(job.companyName);
  const applicationUrl = normalizeUrl(job.applyUrl);
  // Source/external IDs identify an occurrence within one source and are
  // stored separately. The canonical exact fingerprint must remain useful
  // across sources, so it is based on stable employer/application evidence.
  // When no application URL exists, the content fingerprint remains the
  // review-only signal rather than being promoted to an exact merge key.
  const exactBasis = applicationUrl ? [applicationUrl, organisation].join('|') : '';
  const contentBasis = [
    normalizeText(job.title),
    organisation,
    normalizeText(job.location),
    normalizeText(job.jobType),
    normalizeText(job.description),
  ].join('|');

  const normalisedPayload = JSON.stringify({
    title: normalizeText(job.title),
    organisation,
    location: normalizeText(job.location),
    employmentType: normalizeText(job.jobType),
    workMode: normalizeText(job.workMode),
    description: normalizeText(job.description),
    applicationUrl,
  });

  return {
    exact: exactBasis ? hash(exactBasis) : '',
    content: hash(contentBasis),
    normalisedPayload: hash(normalisedPayload),
  };
}

export function calculateDuplicateConfidence(evidence: DuplicateEvidence): number {
  if (evidence.externalIdMatches && evidence.organisationMatches) return 100;
  if (evidence.applicationUrlMatches && evidence.organisationMatches) return 98;
  if (evidence.exactFingerprintMatches) return 97;

  let score = 0;
  if (evidence.contentFingerprintMatches) score += 70;
  if (evidence.organisationMatches) score += 15;
  if (evidence.locationMatches) score += 10;
  if (evidence.applicationUrlMatches) score += 10;
  return Math.min(100, score);
}

export function duplicateAction(confidence: number, corroboratedSourceEvidence: boolean) {
  if (confidence >= 95) return 'merge' as const;
  if (confidence >= 80 && corroboratedSourceEvidence) return 'merge' as const;
  if (confidence >= 60) return 'review' as const;
  return 'distinct' as const;
}
