// server/tests/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerRoutes } from '../../routes';
import { initializeDatabase } from '../../db';

describe('API Integration Tests', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    
    // Initialize database with test configuration
    await initializeDatabase();
    
    // Create Express app
    app = express();
    
    // Register routes
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    // Clean up resources
    if (server && server.close) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Categories API', () => {
    it('should return a list of categories', async () => {
      const response = await request(app).get('/api/categories');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Companies API', () => {
    it('should return a list of companies', async () => {
      const response = await request(app).get('/api/companies');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Jobs API', () => {
    it('should return a list of jobs', async () => {
      const response = await request(app).get('/api/jobs');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return featured jobs', async () => {
      const response = await request(app).get('/api/jobs/featured');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search jobs', async () => {
      const response = await request(app).get('/api/jobs/search?q=developer');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid parameters', async () => {
      const response = await request(app).get('/api/jobs/category/invalid');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});