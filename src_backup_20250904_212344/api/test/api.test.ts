// src/api/test/api.test.ts
import request from 'supertest';
import express from 'express';
import main from '../../../server/server';
import { authenticate, authorize } from '../../middleware/auth';
import { rateLimiters } from '../../middleware/rateLimit';

// Mock Firebase auth
jest.mock('../../firebase', () => ({
  auth: {
    verifyIdToken: jest.fn().mockImplementation((token) => {
      if (token === 'valid-token') {
        return Promise.resolve({ uid: 'test-uid', email: 'test@example.com' });
      } else if (token === 'admin-token') {
        return Promise.resolve({ uid: 'admin-uid', email: 'admin@example.com' });
      } else {
        return Promise.reject(new Error('Invalid token'));
      }
    }),
  },
}));

// Mock database
jest.mock('../../../server/db', () => ({
  db: {
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockImplementation(() => ({
        where: jest.fn().mockImplementation(() => {
          return [
            { id: 1, firebaseUid: 'test-uid', role: 'user' },
            { id: 2, firebaseUid: 'admin-uid', role: 'admin' },
          ];
        }),
      })),
    })),
  },
}));

describe('API Tests', () => {
  let app: express.Express;
  
  beforeAll(async () => {
    app = express();
    await main();
  });
  
  describe('API Versioning', () => {
    it('should access v1 API endpoints', async () => {
      const response = await request(app).get('/api/v1/categories');
      expect(response.status).toBe(200);
    });
    
    it('should maintain backward compatibility with legacy endpoints', async () => {
      const response = await request(app).get('/api/categories');
      expect(response.status).toBe(200);
    });
  });
  
  describe('Authentication', () => {
    it('should reject requests without valid token', async () => {
      const response = await request(app)
        .get('/api/v1/protected/users/1')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
    
    it('should allow authenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/protected/users/1')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(200);
    });
    
    it('should enforce role-based authorization', async () => {
      // Regular user trying to access admin endpoint
      const userResponse = await request(app)
        .get('/api/v1/protected/users')
        .set('Authorization', 'Bearer valid-token');
      
      expect(userResponse.status).toBe(403);
      
      // Admin accessing admin endpoint
      const adminResponse = await request(app)
        .get('/api/v1/protected/users')
        .set('Authorization', 'Bearer admin-token');
      
      expect(adminResponse.status).toBe(200);
    });
  });
  
  describe('Rate Limiting', () => {
    it('should apply rate limits', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(101).fill(null).map(() => 
        request(app).get('/api/v1/categories')
      );
      
      const responses = await Promise.all(requests);
      
      // At least one request should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
      
      // Check for rate limit headers
      const headers = responses[0].headers;
      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
      expect(headers['x-ratelimit-reset']).toBeDefined();
    });
  });
  
  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app).get('/api-docs');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Swagger');
    });
    
    it('should serve Swagger JSON spec', async () => {
      const response = await request(app).get('/api-docs.json');
      expect(response.status).toBe(200);
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info.title).toBe('WorkWise SA API');
    });
  });
});
