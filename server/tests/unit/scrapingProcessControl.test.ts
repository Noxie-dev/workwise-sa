import { describe, expect, it, vi } from 'vitest';
import { requestScrapingProcessTermination } from '../../services/scrapingProcessControl';

describe('scraping process control', () => {
  it('sends SIGTERM to an active process', () => {
    const kill = vi.fn(() => true);

    expect(requestScrapingProcessTermination({ killed: false, kill })).toBe(true);
    expect(kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('does not signal an already-dead process', () => {
    const kill = vi.fn(() => true);

    expect(requestScrapingProcessTermination({ killed: true, kill })).toBe(false);
    expect(kill).not.toHaveBeenCalled();
  });

  it('returns false when no process is registered', () => {
    expect(requestScrapingProcessTermination(undefined)).toBe(false);
  });
});
