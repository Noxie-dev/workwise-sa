import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('production mock guards', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_USE_MOCK_PUBLIC_DATA', 'false');
  });

  it('does not expose fabricated marketing rules without explicit mock mode', async () => {
    const { default: marketingRuleService } = await import('@/services/marketingRuleService');

    await expect(marketingRuleService.getRules()).rejects.toThrow(
      'Marketing rules service is not configured for this environment',
    );
  });

  it('does not fabricate AI job content without explicit mock mode', async () => {
    const { generateAIContent } = await import('@/services/jobService');

    await expect(generateAIContent('write a description', 'description', {})).rejects.toThrow(
      'Job service is not configured for this environment',
    );
  });

  it('does not claim job submission succeeded without an API-backed service', async () => {
    const { submitJobPost, fetchLocationSuggestions } = await import('@/services/jobService');

    await expect(submitJobPost({} as any)).rejects.toThrow(
      'Job service is not configured for this environment',
    );
    await expect(fetchLocationSuggestions('Cape')).rejects.toThrow(
      'Job service is not configured for this environment',
    );
  });
});
