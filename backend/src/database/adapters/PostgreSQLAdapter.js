/**
 * PostgreSQL Database Adapter
 * Implements the DatabaseAdapter interface for PostgreSQL
 */

const { Pool } = require('pg');
const DatabaseAdapter = require('../abstract/DatabaseAdapter');
const { getDbConfig } = require('../config');

class PostgreSQLAdapter extends DatabaseAdapter {
  constructor() {
    super();
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Connect to PostgreSQL database
   */
  async connect() {
    try {
      const { config } = getDbConfig();
      this.pool = new Pool(config);
      
      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ PostgreSQL database connected successfully');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from PostgreSQL database
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 PostgreSQL connection closed');
    }
  }

  /**
   * Execute a query
   */
  async query(sql, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    const start = Date.now();
    try {
      const result = await this.pool.query(sql, params);
      const duration = Date.now() - start;
      console.log('📊 PostgreSQL Query executed:', { sql, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('❌ PostgreSQL Query failed:', { sql, error: error.message });
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

    const client = await this.pool.connect();
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
   * Get health status
   */
  async getHealthStatus() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }
      
      const result = await this.query('SELECT NOW() as current_time, version() as version');
      return {
        status: 'connected',
        message: 'PostgreSQL database is healthy',
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * PostgreSQL-specific: Create table if not exists
   */
  async createTableIfNotExists(tableName, columns) {
    const columnDefinitions = columns.map(col => {
      if (typeof col === 'string') {
        return col;
      }
      return `${col.name} ${col.type}${col.constraints ? ' ' + col.constraints : ''}`;
    }).join(', ');
    
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
    await this.query(sql);
  }

  /**
   * PostgreSQL-specific: Drop table if exists
   */
  async dropTableIfExists(tableName) {
    const sql = `DROP TABLE IF EXISTS ${tableName} CASCADE`;
    await this.query(sql);
  }

  /**
   * PostgreSQL-specific: Create index if not exists
   */
  async createIndexIfNotExists(indexName, tableName, columns, unique = false) {
    const uniqueClause = unique ? 'UNIQUE ' : '';
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    const sql = `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columnList})`;
    await this.query(sql);
  }
}

module.exports = PostgreSQLAdapter;
