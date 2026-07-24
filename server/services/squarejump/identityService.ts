import crypto from 'crypto';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeBase32(value: bigint, length: number): string {
  let encoded = '';
  let remaining = value;
  for (let index = 0; index < length; index += 1) {
    encoded = CROCKFORD[Number(remaining & 31n)] + encoded;
    remaining >>= 5n;
  }
  return encoded;
}

function randomBase32(length: number): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, byte => CROCKFORD[byte & 31]).join('');
}

/** Generates a time-sortable opaque ULID-style SquareJUMP identifier. */
export function createJuid(now: Date = new Date()): string {
  const timestamp = encodeBase32(BigInt(now.getTime()), 10);
  return `juid_sq_${timestamp}${randomBase32(16)}`;
}

export function createOrganisationUid(now: Date = new Date()): string {
  const timestamp = encodeBase32(BigInt(now.getTime()), 10);
  return `org_sq_${timestamp}${randomBase32(16)}`;
}

function safeCode(value: string | null | undefined, fallback: string): string {
  const normalized = value
    ?.toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  return normalized || fallback;
}

export function createPublicJobRef(input: {
  provinceCode?: string | null;
  categoryCode?: string | null;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('');

  return [
    'TS',
    'JB',
    safeCode(input.provinceCode, 'ZA'),
    safeCode(input.categoryCode, 'OTH'),
    date,
    randomBase32(6),
  ].join('-');
}
