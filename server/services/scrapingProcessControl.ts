export type KillableScrapingProcess = {
  killed: boolean;
  kill: (signal?: NodeJS.Signals) => boolean;
};

export type ScrapingProcessExitState = {
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
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

export function shouldForceScrapingProcessKill(
  process: ScrapingProcessExitState,
): boolean {
  return process.exitCode === null && process.signalCode === null;
}
