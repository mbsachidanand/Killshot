/**
 * Database Factory
 * Factory for creating database adapters
 *
 * @fileoverview TypeScript implementation of database factory pattern
 */

import DatabaseAdapter from './abstract/DatabaseAdapter';
import { PostgreSQLAdapter } from './adapters/PostgreSQLAdapter';
import { getDbConfig } from './config';

/**
 * Database Factory Class
 *
 * This class implements the factory pattern for creating database adapters.
 * It provides a centralized way to create and manage database connections.
 */
export class DatabaseFactory {
  private static instance: DatabaseFactory;
  private adapters: Map<string, DatabaseAdapter> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   *
   * @returns {DatabaseFactory} Singleton instance
   */
  public static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  /**
   * Create a database adapter
   *
   * @param type - Database type
   * @returns {DatabaseAdapter} Database adapter instance
   * @throws {Error} If database type is not supported
   */
  public createAdapter(type?: string): DatabaseAdapter {
    const dbType = type || getDbConfig().type;

    // Check if adapter already exists
    if (this.adapters.has(dbType)) {
      return this.adapters.get(dbType)!;
    }

    let adapter: DatabaseAdapter;

    switch (dbType.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        adapter = new PostgreSQLAdapter();
        break;

      case 'mysql':
        throw new Error('MySQL adapter not yet implemented');

      case 'sqlite':
        throw new Error('SQLite adapter not yet implemented');

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }

    // Cache the adapter
    this.adapters.set(dbType, adapter);
    return adapter;
  }

  /**
   * Get existing adapter by type
   *
   * @param type - Database type
   * @returns {DatabaseAdapter | null} Database adapter or null if not found
   */
  public getAdapter(type: string): DatabaseAdapter | null {
    return this.adapters.get(type) || null;
  }

  /**
   * Get all adapters
   *
   * @returns {Map<string, DatabaseAdapter>} Map of all adapters
   */
  public getAllAdapters(): Map<string, DatabaseAdapter> {
    return new Map(this.adapters);
  }

  /**
   * Remove adapter
   *
   * @param type - Database type
   * @returns {boolean} True if adapter was removed
   */
  public removeAdapter(type: string): boolean {
    const adapter = this.adapters.get(type);
    if (adapter) {
      // Disconnect before removing
      adapter.disconnect().catch(console.error);
      return this.adapters.delete(type);
    }
    return false;
  }

  /**
   * Clear all adapters
   *
   * @returns {Promise<void>} Promise that resolves when all adapters are cleared
   */
  public async clearAllAdapters(): Promise<void> {
    const disconnectPromises = Array.from(this.adapters.values()).map(adapter =>
      adapter.disconnect().catch(console.error)
    );

    await Promise.all(disconnectPromises);
    this.adapters.clear();
  }

  /**
   * Get default adapter based on configuration
   *
   * @returns {DatabaseAdapter} Default database adapter
   */
  public getDefaultAdapter(): DatabaseAdapter {
    const config = getDbConfig();
    return this.createAdapter(config.type);
  }

  /**
   * Check if adapter exists
   *
   * @param type - Database type
   * @returns {boolean} True if adapter exists
   */
  public hasAdapter(type: string): boolean {
    return this.adapters.has(type);
  }

  /**
   * Get adapter count
   *
   * @returns {number} Number of adapters
   */
  public getAdapterCount(): number {
    return this.adapters.size;
  }

  /**
   * Get supported database types
   *
   * @returns {string[]} Array of supported database types
   */
  public getSupportedTypes(): string[] {
    return ['postgresql', 'mysql', 'sqlite'];
  }

  /**
   * Validate database type
   *
   * @param type - Database type to validate
   * @returns {boolean} True if type is supported
   */
  public isValidType(type: string): boolean {
    return this.getSupportedTypes().includes(type.toLowerCase());
  }

  /**
   * Get factory statistics
   *
   * @returns {object} Factory statistics
   */
  public getStats(): {
    totalAdapters: number;
    connectedAdapters: number;
    supportedTypes: string[];
    adapters: string[];
  } {
    const connectedAdapters = Array.from(this.adapters.values())
      .filter(adapter => adapter.getConnectionStatus()).length;

    return {
      totalAdapters: this.adapters.size,
      connectedAdapters,
      supportedTypes: this.getSupportedTypes(),
      adapters: Array.from(this.adapters.keys())
    };
  }
}

/**
 * Get default database adapter
 *
 * @returns {DatabaseAdapter} Default database adapter
 */
export function getDatabaseAdapter(): DatabaseAdapter {
  return DatabaseFactory.getInstance().getDefaultAdapter();
}

/**
 * Create a new database adapter
 *
 * @param type - Database type
 * @returns {DatabaseAdapter} Database adapter instance
 */
export function createDatabaseAdapter(type?: string): DatabaseAdapter {
  return DatabaseFactory.getInstance().createAdapter(type);
}

export default DatabaseFactory;
