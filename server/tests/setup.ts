// server/tests/setup.ts
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { initializeDatabase } from '../db';
import { secretManager } from '../services/secretManager';
import { logger } from '../utils/logger';
import { runMigrations } from '../migrations';

// Mock environment variables for testing
vi.mock('../services/secretManager', () => ({
  secretManager: {
    getSecret: vi.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'DATABASE_URL':
          return 'sqlite://./test.db';
        case 'PORT':
          return '5001';
        case 'FIREBASE_PROJECT_ID':
          return 'test-project';
        case 'FIREBASE_STORAGE_BUCKET':
          return 'test-project.appspot.com';
        default:
          return null;
      }
    })
  }
}));

// Mock logger to prevent console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

// Setup test database before all tests
beforeAll(async () => {
  // Run migrations on test database
  await runMigrations();
  
  // Initialize database connection
  await initializeDatabase();
  
  logger.info('Test database initialized');
});

// Clean up after all tests
afterAll(async () => {
  // Any cleanup needed after all tests
  logger.info('Test cleanup completed');
});

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});