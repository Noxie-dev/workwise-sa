import '../env';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { config } from 'dotenv';

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  config();
}

class SecretManagerService {
  private client?: SecretManagerServiceClient;
  private secrets: Map<string, string> = new Map();
  private projectId: string;

  constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || 'workwise-sa-project';

  }

  async getSecret(secretName: string): Promise<string | null> {
    if (this.secrets.has(secretName)) {
      return this.secrets.get(secretName)!;
    }

    // Always check environment variables first
    const secret = process.env[secretName];
    if (secret) {
      this.secrets.set(secretName, secret);
      return secret;
    }

    // Hosts such as Fly inject secrets through the environment.
    if (process.env.SECRET_SOURCE === 'env') return null;

    // In development, return null for missing secrets instead of throwing
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  Secret ${secretName} not found in environment variables, using null`);
      return null;
    }

    // Only try Google Cloud Secret Manager in production
    try {
      this.client ??= new SecretManagerServiceClient();
      const [version] = await this.client.accessSecretVersion({
        name: `projects/${this.projectId}/secrets/${secretName}/versions/latest`,
      });

      const payload = version.payload?.data?.toString();
      if (payload) {
        this.secrets.set(secretName, payload);
        return payload;
      }
    } catch (error) {
      console.error(`Error fetching secret ${secretName}:`, error);
    }

    throw new Error(`Secret ${secretName} not found.`);
  }
}

export const secretManager = new SecretManagerService();
