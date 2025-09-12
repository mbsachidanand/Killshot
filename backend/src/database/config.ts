/**
 * Database Configuration
 * Centralized configuration for database connections
 *
 * @fileoverview TypeScript implementation of database configuration with type safety
 */

import { DatabaseConfig } from '@/types';

/**
 * Get database configuration from environment variables
 *
 * @returns {DatabaseConfig} Database configuration object
 */
export function getDbConfig(): DatabaseConfig {
  const dbType = (process.env.DB_TYPE as 'postgresql' | 'mysql' | 'sqlite') || 'postgresql';

  const baseConfig: DatabaseConfig = {
    type: dbType,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'expense_manager_db',
    user: process.env.DB_USER || 'expense_manager_user',
    password: process.env.DB_PASSWORD || 'expense_manager_password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10')
    }
  };

  return baseConfig;
}

/**
 * Get PostgreSQL specific configuration
 *
 * @returns {object} PostgreSQL configuration
 */
export function getPostgreSQLConfig(): object {
  const config = getDbConfig();

  return {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
    pool: config.pool
  };
}

/**
 * Get MySQL specific configuration
 *
 * @returns {object} MySQL configuration
 */
export function getMySQLConfig(): object {
  const config = getDbConfig();

  return {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    connectionLimit: config.pool?.max || 10
  };
}

/**
 * Get SQLite specific configuration
 *
 * @returns {object} SQLite configuration
 */
export function getSQLiteConfig(): object {
  const config = getDbConfig();

  return {
    filename: config.database || './expense_manager.db'
  };
}

/**
 * Validate database configuration
 *
 * @param config - Database configuration to validate
 * @returns {boolean} True if configuration is valid
 * @throws {Error} If configuration is invalid
 */
export function validateDbConfig(config: DatabaseConfig): boolean {
  if (!config.type || !['postgresql', 'mysql', 'sqlite'].includes(config.type)) {
    throw new Error('Invalid database type. Must be postgresql, mysql, or sqlite');
  }

  if (!config.host || typeof config.host !== 'string') {
    throw new Error('Database host is required and must be a string');
  }

  if (!config.port || typeof config.port !== 'number' || config.port <= 0) {
    throw new Error('Database port is required and must be a positive number');
  }

  if (!config.database || typeof config.database !== 'string') {
    throw new Error('Database name is required and must be a string');
  }

  if (!config.user || typeof config.user !== 'string') {
    throw new Error('Database user is required and must be a string');
  }

  if (!config.password || typeof config.password !== 'string') {
    throw new Error('Database password is required and must be a string');
  }

  if (config.pool) {
    if (config.pool.min < 0 || config.pool.max < 0) {
      throw new Error('Pool min and max values must be non-negative');
    }

    if (config.pool.min > config.pool.max) {
      throw new Error('Pool min value cannot be greater than max value');
    }
  }

  return true;
}

/**
 * Get connection string for the database
 *
 * @param config - Database configuration
 * @returns {string} Connection string
 */
export function getConnectionString(config: DatabaseConfig): string {
  switch (config.type) {
    case 'postgresql':
      return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;

    case 'mysql':
      return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;

    case 'sqlite':
      return `sqlite:${config.database}`;

    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

/**
 * Check if database configuration is valid
 *
 * @returns {boolean} True if configuration is valid
 */
export function isDbConfigValid(): boolean {
  try {
    const config = getDbConfig();
    return validateDbConfig(config);
  } catch (error) {
    console.error('Database configuration validation failed:', error);
    return false;
  }
}

export default getDbConfig;
