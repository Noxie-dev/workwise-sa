import { neon } from '@neondatabase/serverless';

/**
 * PostgreSQL database connection for Netlify functions
 * Uses Neon serverless driver for edge compatibility
 */

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
};

/**
 * Database client with query interface
 * Compatible with pg-style query calls: db.query(sql, params)
 */
export const db = {
  /**
   * Execute a SQL query
   * @param {string} sql - SQL query string with $1, $2, etc. placeholders
   * @param {Array} params - Query parameters
   * @returns {Promise<{rows: Array}>} Query result with rows array
   */
  async query(sql, params = []) {
    const sqlClient = neon(getDatabaseUrl());
    
    try {
      const rows = await sqlClient(sql, params);
      return { rows };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

export default db;
