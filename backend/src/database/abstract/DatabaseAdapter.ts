/**
 * Abstract Database Adapter
 * Base class for database adapters with common functionality
 *
 * @fileoverview TypeScript implementation of the database adapter pattern
 */

import { QueryResult, Transaction } from '@/types';

/**
 * Abstract Database Adapter Class
 *
 * This abstract class defines the interface that all database adapters must implement.
 * It provides a common structure for database operations across different database systems.
 */
export abstract class DatabaseAdapter {
  protected isConnected: boolean = false;

  /**
   * Connect to the database
   *
   * @returns {Promise<void>} Promise that resolves when connected
   * @throws {Error} If connection fails
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the database
   *
   * @returns {Promise<void>} Promise that resolves when disconnected
   * @throws {Error} If disconnection fails
   */
  abstract disconnect(): Promise<void>;

  /**
   * Execute a query
   *
   * @param text - SQL query string
   * @param params - Query parameters
   * @returns {Promise<QueryResult<T>>} Query result
   * @throws {Error} If query fails
   */
  abstract query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;

  /**
   * Execute a transaction
   *
   * @param callback - Transaction callback function
   * @returns {Promise<T>} Transaction result
   * @throws {Error} If transaction fails
   */
  abstract transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;

  /**
   * Check if connected to database
   *
   * @returns {boolean} True if connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Validate query parameters
   *
   * @param params - Query parameters to validate
   * @returns {boolean} True if parameters are valid
   * @throws {Error} If parameters are invalid
   */
  protected validateParams(params?: any[]): boolean {
    if (params && !Array.isArray(params)) {
      throw new Error('Query parameters must be an array');
    }
    return true;
  }

  /**
   * Validate SQL query
   *
   * @param text - SQL query to validate
   * @returns {boolean} True if query is valid
   * @throws {Error} If query is invalid
   */
  protected validateQuery(text: string): boolean {
    if (!text || typeof text !== 'string') {
      throw new Error('Query text must be a non-empty string');
    }

    if (text.trim().length === 0) {
      throw new Error('Query text cannot be empty');
    }

    return true;
  }

  /**
   * Sanitize query parameters
   *
   * @param params - Parameters to sanitize
   * @returns {any[]} Sanitized parameters
   */
  protected sanitizeParams(params?: any[]): any[] {
    if (!params) return [];

    return params.map(param => {
      if (param === null || param === undefined) {
        return null;
      }

      if (typeof param === 'string') {
        // Basic SQL injection prevention
        return param.replace(/[';--]/g, '');
      }

      return param;
    });
  }

  /**
   * Log database operation
   *
   * @param operation - Operation name
   * @param query - SQL query
   * @param params - Query parameters
   * @param duration - Operation duration in milliseconds
   */
  protected logOperation(
    operation: string,
    query: string,
    params?: any[],
    duration?: number
  ): void {
    const logData = {
      operation,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      paramCount: params?.length || 0,
      duration: duration ? `${duration}ms` : 'N/A',
      timestamp: new Date().toISOString()
    };

    console.log('Database Operation:', logData);
  }

  /**
   * Handle database errors
   *
   * @param error - Error object
   * @param operation - Operation that failed
   * @param query - SQL query that failed
   * @returns {Error} Formatted error
   */
  protected handleError(error: any, operation: string, query: string): Error {
    const dbError = new Error(`Database ${operation} failed: ${error.message}`);
    (dbError as any).originalError = error;
    (dbError as any).operation = operation;
    (dbError as any).query = query;
    (dbError as any).timestamp = new Date().toISOString();

    return dbError;
  }

  /**
   * Test database connection
   *
   * @returns {Promise<boolean>} True if connection test succeeds
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database information
   *
   * @returns {Promise<object>} Database information
   */
  public async getDatabaseInfo(): Promise<{
    type: string;
    version?: string;
    connected: boolean;
    timestamp: string;
  }> {
    return {
      type: this.constructor.name.replace('Adapter', '').toLowerCase(),
      connected: this.isConnected,
      timestamp: new Date().toISOString()
    };
  }
}

export default DatabaseAdapter;
