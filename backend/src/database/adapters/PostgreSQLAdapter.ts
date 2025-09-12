/**
 * PostgreSQL Database Adapter
 * Implements the DatabaseAdapter interface for PostgreSQL
 *
 * @fileoverview TypeScript implementation of PostgreSQL database adapter
 */

import { QueryResult, Transaction } from '@/types';
import { QueryResult as PGQueryResult, Pool, PoolClient } from 'pg';
import DatabaseAdapter from '../abstract/DatabaseAdapter';
import { getPostgreSQLConfig } from '../config';

/**
 * PostgreSQL Transaction Implementation
 *
 * This class implements the Transaction interface for PostgreSQL
 */
class PostgreSQLTransaction implements Transaction {
  private client: PoolClient;
  private completed: boolean = false;

  constructor(client: PoolClient) {
    this.client = client;
  }

  /**
   * Execute a query within the transaction
   *
   * @param text - SQL query string
   * @param params - Query parameters
   * @returns {Promise<QueryResult<T>>} Query result
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (this.completed) {
      throw new Error('Transaction has already been completed');
    }

    const startTime = Date.now();
    try {
      const result: PGQueryResult<any> = await this.client.query(text, params);
      const duration = Date.now() - startTime;

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command
      };
    } catch (error) {
      throw this.handleError(error, 'query', text);
    }
  }

  /**
   * Commit the transaction
   *
   * @returns {Promise<void>} Promise that resolves when committed
   */
  async commit(): Promise<void> {
    if (this.completed) {
      throw new Error('Transaction has already been completed');
    }

    try {
      await this.client.query('COMMIT');
      this.completed = true;
    } catch (error) {
      await this.rollback();
      throw this.handleError(error, 'commit', 'COMMIT');
    } finally {
      this.client.release();
    }
  }

  /**
   * Rollback the transaction
   *
   * @returns {Promise<void>} Promise that resolves when rolled back
   */
  async rollback(): Promise<void> {
    if (this.completed) {
      return;
    }

    try {
      await this.client.query('ROLLBACK');
      this.completed = true;
    } catch (error) {
      console.error('Error during rollback:', error);
    } finally {
      this.client.release();
    }
  }

  /**
   * Handle transaction errors
   *
   * @param error - Error object
   * @param operation - Operation that failed
   * @param query - SQL query that failed
   * @returns {Error} Formatted error
   */
  private handleError(error: any, operation: string, query: string): Error {
    const dbError = new Error(`Transaction ${operation} failed: ${error.message}`);
    (dbError as any).originalError = error;
    (dbError as any).operation = operation;
    (dbError as any).query = query;
    (dbError as any).timestamp = new Date().toISOString();

    return dbError;
  }
}

/**
 * PostgreSQL Database Adapter Class
 *
 * This class implements the DatabaseAdapter interface for PostgreSQL databases.
 * It provides connection pooling, transaction support, and query execution.
 */
export class PostgreSQLAdapter extends DatabaseAdapter {
  private pool: Pool | null = null;

  /**
   * Constructor for PostgreSQLAdapter
   */
  constructor() {
    super();
  }

  /**
   * Connect to PostgreSQL database
   *
   * @returns {Promise<void>} Promise that resolves when connected
   * @throws {Error} If connection fails
   */
  async connect(): Promise<void> {
    try {
      const config = getPostgreSQLConfig() as any;

      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl,
        min: config.pool?.min || 2,
        max: config.pool?.max || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.isConnected = true;
      console.log('✅ Connected to PostgreSQL database');
    } catch (error) {
      this.isConnected = false;
      throw this.handleError(error, 'connect', 'CONNECT');
    }
  }

  /**
   * Disconnect from PostgreSQL database
   *
   * @returns {Promise<void>} Promise that resolves when disconnected
   * @throws {Error} If disconnection fails
   */
  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      this.isConnected = false;
      console.log('✅ Disconnected from PostgreSQL database');
    } catch (error) {
      throw this.handleError(error, 'disconnect', 'DISCONNECT');
    }
  }

  /**
   * Execute a query
   *
   * @param text - SQL query string
   * @param params - Query parameters
   * @returns {Promise<QueryResult<T>>} Query result
   * @throws {Error} If query fails
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    this.validateQuery(text);
    this.validateParams(params);
    const sanitizedParams = this.sanitizeParams(params);

    const startTime = Date.now();
    try {
      const result: PGQueryResult<T> = await this.pool.query(text, sanitizedParams);
      const duration = Date.now() - startTime;

      this.logOperation('query', text, sanitizedParams, duration);

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command
      };
    } catch (error) {
      throw this.handleError(error, 'query', text);
    }
  }

  /**
   * Execute a transaction
   *
   * @param callback - Transaction callback function
   * @returns {Promise<T>} Transaction result
   * @throws {Error} If transaction fails
   */
  async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    const transaction = new PostgreSQLTransaction(client);

    try {
      await client.query('BEGIN');
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw this.handleError(error, 'transaction', 'TRANSACTION');
    }
  }

  /**
   * Get database information
   *
   * @returns {Promise<object>} Database information
   */
  override async getDatabaseInfo(): Promise<{
    type: string;
    version?: string;
    connected: boolean;
    timestamp: string;
    poolSize?: number;
    idleConnections?: number;
  }> {
    const baseInfo = await super.getDatabaseInfo();

    if (this.pool) {
      return {
        ...baseInfo,
        poolSize: this.pool.totalCount,
        idleConnections: this.pool.idleCount
      };
    }

    return baseInfo;
  }

  /**
   * Get connection pool statistics
   *
   * @returns {object} Pool statistics
   */
  getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } | null {
    if (!this.pool) return null;

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  /**
   * Health check for the database connection
   *
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return result.rows.length > 0 && result.rows[0].health_check === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export default PostgreSQLAdapter;
