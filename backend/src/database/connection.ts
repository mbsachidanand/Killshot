/**
 * Database Connection Manager
 * Provides a unified interface for database operations across different database types
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { getDbConfig, validateDbConfig } from './config';

interface HealthStatus {
  status: 'connected' | 'disconnected' | 'error';
  message: string;
  currentTime?: string;
}

class DatabaseConnection {
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    try {
      const dbConfig = getDbConfig();
      validateDbConfig(dbConfig);
      const { type, ...config } = dbConfig;

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
      console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return await this.pool.connect();
  }

  /**
   * Execute a query with parameters
   */
  async query(text: string, params: any[] = []): Promise<QueryResult> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('📊 Query executed:', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('❌ Query failed:', { text, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.isConnected || !this.pool) {
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
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Database connection closed');
    }
  }

  /**
   * Check if database is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
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
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create a singleton instance
const dbConnection = new DatabaseConnection();

export default dbConnection;
