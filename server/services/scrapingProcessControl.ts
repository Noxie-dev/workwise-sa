export type KillableScrapingProcess = {
  killed: boolean;
  kill: (signal?: NodeJS.Signals) => boolean;
};

/** Request graceful termination without sending duplicate signals. */
export function requestScrapingProcessTermination(
  process: KillableScrapingProcess | undefined,
): boolean {
  if (!process || process.killed) {
    return false;
  }

  return process.kill('SIGTERM');
}
