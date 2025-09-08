/**
 * Database Factory
 * Creates and manages database adapter instances
 */

const { getDbConfig } = require('./config');
const PostgreSQLAdapter = require('./adapters/PostgreSQLAdapter');

class DatabaseFactory {
  constructor() {
    this.adapters = new Map();
    this.currentAdapter = null;
  }

  /**
   * Register a database adapter
   */
  registerAdapter(type, adapterClass) {
    this.adapters.set(type.toLowerCase(), adapterClass);
  }

  /**
   * Get the current database adapter
   */
  async getAdapter() {
    if (!this.currentAdapter) {
      const { type } = getDbConfig();
      const adapterClass = this.adapters.get(type.toLowerCase());
      
      if (!adapterClass) {
        throw new Error(`No adapter registered for database type: ${type}`);
      }
      
      this.currentAdapter = new adapterClass();
      await this.currentAdapter.connect();
    }
    
    return this.currentAdapter;
  }

  /**
   * Switch to a different database adapter
   */
  async switchAdapter(type) {
    if (this.currentAdapter) {
      await this.currentAdapter.disconnect();
    }
    
    const adapterClass = this.adapters.get(type.toLowerCase());
    if (!adapterClass) {
      throw new Error(`No adapter registered for database type: ${type}`);
    }
    
    this.currentAdapter = new adapterClass();
    await this.currentAdapter.connect();
    
    return this.currentAdapter;
  }

  /**
   * Disconnect from current database
   */
  async disconnect() {
    if (this.currentAdapter) {
      await this.currentAdapter.disconnect();
      this.currentAdapter = null;
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    if (!this.currentAdapter) {
      return { status: 'disconnected', message: 'No database adapter connected' };
    }
    
    return await this.currentAdapter.getHealthStatus();
  }
}

// Create and configure the factory instance
const databaseFactory = new DatabaseFactory();

// Register available adapters
databaseFactory.registerAdapter('postgresql', PostgreSQLAdapter);

// TODO: Register other adapters when implemented
// databaseFactory.registerAdapter('mysql', MySQLAdapter);
// databaseFactory.registerAdapter('sqlite', SQLiteAdapter);

module.exports = databaseFactory;
