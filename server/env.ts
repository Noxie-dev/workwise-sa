import { config } from 'dotenv';

// Deployment-provided variables win; Neon local values precede .env defaults.
config({ path: '.env.local' });
config();
