import { describe, expect, it } from 'vitest';
import { parseZarSalary } from '../../services/jobMatchingService';

describe('jobMatchingService', () => {
  it('parses ZAR salary ranges into numeric preview metadata', () => {
    expect(parseZarSalary('R25,000 - R35,000 per month')).toEqual({
      min: 25000,
      max: 35000,
      currency: 'ZAR',
      negotiable: false,
      displayText: 'R25,000 - R35,000 per month',
    });
  });

  it('marks negotiable salary text while preserving display value', () => {
    expect(parseZarSalary('Market related, negotiable')).toEqual({
      min: undefined,
      max: undefined,
      currency: 'ZAR',
      negotiable: true,
      displayText: 'R Market related, negotiable',
    });
  });
});
