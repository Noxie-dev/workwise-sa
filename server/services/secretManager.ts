
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { config } from 'dotenv';

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  config();
}

class SecretManagerService {
  private client: SecretManagerServiceClient;
  private secrets: Map<string, string> = new Map();
  private projectId: string;

  constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || 'workwise-sa-project';
    this.client = new SecretManagerServiceClient();
  }

  async getSecret(secretName: string): Promise<string> {
    if (this.secrets.has(secretName)) {
      return this.secrets.get(secretName)!;
    }

    if (process.env.NODE_ENV !== 'production') {
      const secret = process.env[secretName];
      if (secret) {
        this.secrets.set(secretName, secret);
        return secret;
      }
    }

    try {
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
