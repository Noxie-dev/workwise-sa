import dotenv from 'dotenv';
import { closeDatabase, initializeDatabase } from '../db';
import { verifyApplicationLinks } from '../services/squarejump/applicationLinkVerificationService';
import { logger } from '../utils/logger';

dotenv.config({ path: ['.env.local', '.env'] });

void initializeDatabase()
  .then(() => verifyApplicationLinks())
  .then(result => logger.info('SquareJUMP link verification completed', result))
  .catch(error => {
    logger.error('SquareJUMP link verification failed', { error });
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
