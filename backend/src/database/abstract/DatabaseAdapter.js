/**
 * Database Adapter Abstract Class
 * Defines the interface that all database adapters must implement
 */

class DatabaseAdapter {
  constructor() {
    if (this.constructor === DatabaseAdapter) {
      throw new Error('DatabaseAdapter is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Connect to the database
   */
  async connect() {
    throw new Error('connect() method must be implemented by subclass');
  }

  /**
   * Disconnect from the database
   */
  async disconnect() {
    throw new Error('disconnect() method must be implemented by subclass');
  }

  /**
   * Execute a query
   */
  async query(sql, params = []) {
    throw new Error('query() method must be implemented by subclass');
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    throw new Error('transaction() method must be implemented by subclass');
  }

  /**
   * Get a single record
   */
  async getOne(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows && result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get multiple records
   */
  async getMany(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows || [];
  }

  /**
   * Insert a record and return the inserted record
   */
  async insert(table, data, returning = '*') {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING ${returning}`;
    const result = await this.query(sql, values);
    return result.rows[0];
  }

  /**
   * Update records and return the updated record
   */
  async update(table, data, where, returning = '*') {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    
    const whereClause = Object.keys(where).map((col, index) => 
      `${col} = $${values.length + index + 1}`
    ).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`;
    const allValues = [...values, ...Object.values(where)];
    
    const result = await this.query(sql, allValues);
    return result.rows[0];
  }

  /**
   * Delete records and return the deleted record
   */
  async delete(table, where, returning = '*') {
    const whereClause = Object.keys(where).map((col, index) => 
      `${col} = $${index + 1}`
    ).join(' AND ');
    
    const sql = `DELETE FROM ${table} WHERE ${whereClause} RETURNING ${returning}`;
    const result = await this.query(sql, Object.values(where));
    return result.rows[0];
  }

  /**
   * Check if a record exists
   */
  async exists(table, where) {
    const whereClause = Object.keys(where).map((col, index) => 
      `${col} = $${index + 1}`
    ).join(' AND ');
    
    const sql = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const result = await this.query(sql, Object.values(where));
    return result.rows.length > 0;
  }

  /**
   * Count records
   */
  async count(table, where = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    let params = [];
    
    if (Object.keys(where).length > 0) {
      const whereClause = Object.keys(where).map((col, index) => 
        `${col} = $${index + 1}`
      ).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params = Object.values(where);
    }
    
    const result = await this.query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    throw new Error('getHealthStatus() method must be implemented by subclass');
  }
}

module.exports = DatabaseAdapter;
