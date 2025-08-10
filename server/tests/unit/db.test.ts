// server/tests/unit/db.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { initializeDatabase, getDB } from '../../db';

// Mock the secretManager
vi.mock('../../services/secretManager', () => ({
  secretManager: {
    getSecret: vi.fn().mockResolvedValue('sqlite:./test.db')
  }
}));

describe('Database Module', () => {
  beforeAll(async () => {
    // Initialize the database before tests
    await initializeDatabase();
  });

  it('should initialize the database successfully', async () => {
    const db = getDB();
    expect(db).toBeDefined();
  });

  it('should throw an error if getDB is called before initialization', async () => {
    // Mock the dbInitialized flag to be false
    vi.mock('../../db', () => {
      const original = vi.importActual('../../db');
      return {
        ...original,
        dbInitialized: false
      };
    });

    expect(() => getDB()).toThrow('Database not initialized');
  });

  afterAll(() => {
    // Clean up any resources if needed
  });
});