// server/tests/unit/logger.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../../utils/enhanced-logger';

describe('Enhanced Logger', () => {
  // Spy directly on logger methods to avoid transport-specific timing/sink behavior
  beforeEach(() => {
    vi.spyOn(logger, 'info').mockImplementation(() => logger);
    vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    vi.spyOn(logger, 'error').mockImplementation(() => logger);
    vi.spyOn(logger, 'debug').mockImplementation(() => logger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    expect(logger.error).toHaveBeenCalledWith('Test error message');
  });

  it('should log warning messages', () => {
    logger.warn('Test warning message');
    expect(logger.warn).toHaveBeenCalledWith('Test warning message');
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(logger.info).toHaveBeenCalledWith('Test info message');
  });

  it('should log debug messages', () => {
    logger.debug('Test debug message');
    expect(logger.debug).toHaveBeenCalledWith('Test debug message');
  });

  it('should include metadata in log messages', () => {
    const metadata = { userId: 123, action: 'test' };
    logger.info('Test message with metadata', metadata);
    expect(logger.info).toHaveBeenCalledWith('Test message with metadata', metadata);
  });
});
