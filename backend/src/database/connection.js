/**
 * Database Connection Manager
 * Provides a unified interface for database operations across different database types
 */

const { Pool } = require('pg');
const { getDbConfig, validateConfig } = require('./config');

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   */
  async connect() {
    try {
      validateConfig();
      const { type, config } = getDbConfig();
      
      if (type === 'postgresql') {
        this.pool = new Pool(config);
        
        // Test the connection
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        this.isConnected = true;
        console.log('✅ PostgreSQL database connected successfully');
      } else {
        throw new Error(`Database type ${type} not yet implemented`);
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Get a client from the pool
   */
  async getClient() {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return await this.pool.connect();
  }

  /**
   * Execute a query with parameters
   */
  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('📊 Query executed:', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('❌ Query failed:', { text, error: error.message });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Database connection closed');
    }
  }

  /**
   * Check if database is connected
   */
  isConnected() {
    return this.isConnected;
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }
      
      const result = await this.query('SELECT NOW() as current_time');
      return {
        status: 'connected',
        message: 'Database is healthy',
        currentTime: result.rows[0].current_time
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}

// Create a singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
