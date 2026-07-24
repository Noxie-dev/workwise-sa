import dotenv from 'dotenv';
import { closeDatabase, initializeDatabase } from '../db';
import { logger } from '../utils/logger';
import { refreshAllUserJobMatches } from '../services/squarejump/matchMaterializationService';

dotenv.config({ path: ['.env.local', '.env'] });

async function run() {
  await initializeDatabase();
  const result = await refreshAllUserJobMatches();
  logger.info('SquareJUMP match materialization completed', result);
}

void run()
  .catch(error => {
    logger.error('SquareJUMP match materialization failed', { error });
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
