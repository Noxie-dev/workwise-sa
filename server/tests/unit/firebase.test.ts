// server/tests/unit/firebase.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { isFirebaseInitialized } from '../../firebase';

// Mock the firebase-admin module
vi.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: vi.fn().mockReturnValue({ name: 'mock-app' }),
  firestore: vi.fn().mockReturnValue({}),
  storage: vi.fn().mockReturnValue({})
}));

// Mock the secretManager
vi.mock('../../services/secretManager', () => ({
  secretManager: {
    getSecret: vi.fn().mockImplementation((key) => {
      if (key === 'FIREBASE_PROJECT_ID') return 'test-project';
      if (key === 'FIREBASE_STORAGE_BUCKET') return 'test-bucket.appspot.com';
      return null;
    })
  }
}));

describe('Firebase Module', () => {
  it('should check if Firebase is initialized', () => {
    expect(isFirebaseInitialized).toBeDefined();
    // Since we're mocking, it should return false
    expect(isFirebaseInitialized()).toBe(false);
  });
});