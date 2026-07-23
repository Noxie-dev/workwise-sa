import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { assertProductionDependenciesReady } from '../../services/startupReadiness';

describe('production startup dependency gate', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('allows production startup when database and Firebase are ready', () => {
    expect(() => assertProductionDependenciesReady({ database: true, firebase: true })).not.toThrow();
  });

  it('blocks production startup when Firebase is unavailable', () => {
    expect(() => assertProductionDependenciesReady({ database: true, firebase: false }))
      .toThrow(/unavailable dependencies: firebase/i);
  });

  it('does not block isolated non-production verification', () => {
    process.env.NODE_ENV = 'test';
    expect(() => assertProductionDependenciesReady({ database: false, firebase: false })).not.toThrow();
  });
});
