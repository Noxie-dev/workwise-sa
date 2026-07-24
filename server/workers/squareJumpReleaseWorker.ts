import { closeDatabase, initializeDatabase } from '../db';
import { logger } from '../utils/logger';
import { processDueReleaseEvents } from '../services/squarejump/releaseWorker';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const pollIntervalMs = Math.max(
  1_000,
  Number.parseInt(process.env.SQUAREJUMP_RELEASE_POLL_MS ?? '5000', 10)
);
let stopping = false;
let timer: NodeJS.Timeout | null = null;

async function poll() {
  if (stopping) return;
  try {
    const result = await processDueReleaseEvents(new Date(), 100);
    if (result.processed > 0) logger.info('SquareJUMP releases processed', result);
  } catch (error) {
    logger.error('SquareJUMP release worker poll failed', { error });
  } finally {
    if (!stopping) timer = setTimeout(poll, pollIntervalMs);
  }
}

async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  if (timer) clearTimeout(timer);
  await closeDatabase();
  logger.info('SquareJUMP release worker stopped', { signal });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

async function start() {
  await initializeDatabase();
  logger.info('SquareJUMP release worker started', { pollIntervalMs });
  await poll();
}

void start().catch(error => {
  logger.error('SquareJUMP release worker failed to start', { error });
  process.exitCode = 1;
});
