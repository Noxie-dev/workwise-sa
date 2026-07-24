import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import apiClient from '@/services/apiClient';
import { faqService } from '@/services/faqService';

const mockedApiClient = vi.mocked(apiClient);

describe('faqService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns FAQ data from the API', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 'faq-1', question: 'How?', answer: 'This is how.' }],
      },
    } as any);

    await expect(faqService.getFAQs()).resolves.toEqual([
      { id: 'faq-1', question: 'How?', answer: 'This is how.' },
    ]);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/faqs');
  });

  it('propagates API failures instead of returning canned FAQ content', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('FAQ service unavailable'));

    await expect(faqService.getFAQs()).rejects.toThrow('FAQ service unavailable');
  });

  it('uses the category API path and propagates category failures', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Category service unavailable'));

    await expect(faqService.getFAQsByCategory('employers')).rejects.toThrow(
      'Category service unavailable',
    );
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/faqs/category/employers');
  });
});
