export type StartupDependencies = {
  database: boolean;
  firebase: boolean;
};

/**
 * Production must not accept traffic when a required identity or database
 * dependency is unavailable. Local/test environments may intentionally run
 * with degraded dependencies for isolated verification.
 */
export function assertProductionDependenciesReady(dependencies: StartupDependencies) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = Object.entries(dependencies)
    .filter(([, ready]) => !ready)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Production startup blocked: unavailable dependencies: ${missing.join(', ')}`);
  }
}
