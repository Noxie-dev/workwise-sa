// server/tests/unit/logger.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../../utils/enhanced-logger';

describe('Enhanced Logger', () => {
  // Spy on console methods
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    expect(console.error).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.warn('Test warning message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(console.log).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    logger.debug('Test debug message');
    expect(console.debug).toHaveBeenCalled();
  });

  it('should include metadata in log messages', () => {
    const metadata = { userId: 123, action: 'test' };
    logger.info('Test message with metadata', metadata);
    expect(console.log).toHaveBeenCalled();
    // Check that the log contains the metadata
    const logCall = (console.log as any).mock.calls[0][0];
    expect(logCall).toContain('metadata');
    expect(logCall).toContain('userId');
  });
});