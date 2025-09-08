/**
 * Database Configuration
 * Centralized configuration for database connections
 */

require('dotenv').config();

const dbConfig = {
  // Database type (postgresql, mysql, sqlite, etc.)
  type: process.env.DB_TYPE || 'postgresql',
  
  // PostgreSQL configuration
  postgresql: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'expense_manager_db',
    user: process.env.DB_USER || 'expense_manager_user',
    password: process.env.DB_PASSWORD || 'expense_manager_password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  },
  
  // MySQL configuration (for future use)
  mysql: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'expense_manager_db',
    user: process.env.DB_USER || 'expense_manager_user',
    password: process.env.DB_PASSWORD || 'expense_manager_password',
    connectionLimit: parseInt(process.env.DB_POOL_MAX) || 10,
  },
  
  // SQLite configuration (for future use)
  sqlite: {
    filename: process.env.DB_NAME || './expense_manager.db',
  }
};

/**
 * Get database configuration for the current database type
 */
function getDbConfig() {
  const dbType = dbConfig.type.toLowerCase();
  
  if (!dbConfig[dbType]) {
    throw new Error(`Unsupported database type: ${dbType}`);
  }
  
  return {
    type: dbType,
    config: dbConfig[dbType]
  };
}

/**
 * Get connection string for the current database type
 */
function getConnectionString() {
  const { type, config } = getDbConfig();
  
  switch (type) {
    case 'postgresql':
      return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    case 'mysql':
      return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    case 'sqlite':
      return config.filename;
    default:
      throw new Error(`Connection string not implemented for database type: ${type}`);
  }
}

/**
 * Validate database configuration
 */
function validateConfig() {
  const { type, config } = getDbConfig();
  
  const requiredFields = {
    postgresql: ['host', 'port', 'database', 'user', 'password'],
    mysql: ['host', 'port', 'database', 'user', 'password'],
    sqlite: ['filename']
  };
  
  const fields = requiredFields[type];
  if (!fields) {
    throw new Error(`Validation not implemented for database type: ${type}`);
  }
  
  const missing = fields.filter(field => !config[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required database configuration: ${missing.join(', ')}`);
  }
  
  return true;
}

module.exports = {
  dbConfig,
  getDbConfig,
  getConnectionString,
  validateConfig
};
