// server/tests/unit/db.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { assertProductionDatabaseConnection, initializeDatabase, getDB } from '../../db';

const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock the secretManager
vi.mock('../../services/secretManager', () => ({
  secretManager: {
    getSecret: vi.fn().mockResolvedValue('sqlite:./test.db')
  }
}));

describe('Database Module', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'sqlite:./test.db';

    // Initialize the database before tests
    await initializeDatabase();
  });

  it('should initialize the database successfully', async () => {
    const db = getDB();
    expect(db).toBeDefined();
  });

  it('should return the same initialized database instance', async () => {
    const db1 = getDB();
    const db2 = getDB();
    expect(db1).toBe(db2);
  });

  it('rejects SQLite when production is selected', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(() => assertProductionDatabaseConnection('sqlite:./test.db')).toThrow(/must use PostgreSQL/i);
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });
});
