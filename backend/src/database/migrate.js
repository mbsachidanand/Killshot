/**
 * Database Migration Runner
 * Runs database migrations in order
 */

const fs = require('fs');
const path = require('path');
const { DatabaseFactory } = require('./DatabaseFactory');

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.migrationsTable = 'schema_migrations';
  }

  /**
   * Initialize the migration runner
   */
  async initialize() {
    const factory = DatabaseFactory.getInstance();
    const db = factory.getDefaultAdapter();

    // Connect to database
    await db.connect();

    // Create migrations table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await db.query(createTableSQL);

    return db;
  }

  /**
   * Get list of migration files
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsPath)) {
      return [];
    }

    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(db) {
    const result = await db.query(`SELECT version FROM ${this.migrationsTable} ORDER BY version`);
    return result.rows.map(row => row.version);
  }

  /**
   * Execute a single migration
   */
  async executeMigration(db, filename) {
    const filePath = path.join(this.migrationsPath, filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`🔄 Executing migration: ${filename}`);

    try {
      await db.query(sql);

      // Record the migration as executed
      const version = filename.split('_')[0];
      const name = filename.replace('.sql', '');

      await db.query(
        `INSERT INTO ${this.migrationsTable} (version, name) VALUES ($1, $2)`,
        [version, name]
      );

      console.log(`✅ Migration executed successfully: ${filename}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`, error.message);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    console.log('🚀 Starting database migrations...');

    try {
      const db = await this.initialize();
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations(db);

      const pendingMigrations = migrationFiles.filter(file => {
        const version = file.split('_')[0];
        return !executedMigrations.includes(version);
      });

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations found');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(db, migration);
      }

      console.log('🎉 All migrations completed successfully!');

    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      process.exit(1);
    } finally {
      const factory = DatabaseFactory.getInstance();
      const db = factory.getDefaultAdapter();
      await db.disconnect();
    }
  }

  /**
   * Rollback migrations (for development)
   */
  async rollbackMigrations(count = 1) {
    console.log(`🔄 Rolling back ${count} migration(s)...`);

    try {
      const db = await this.initialize();

      // Get the last executed migrations
      const result = await db.query(
        `SELECT version, name FROM ${this.migrationsTable} ORDER BY executed_at DESC LIMIT $1`,
        [count]
      );

      if (result.rows.length === 0) {
        console.log('✅ No migrations to rollback');
        return;
      }

      for (const migration of result.rows) {
        console.log(`🔄 Rolling back migration: ${migration.version}_${migration.name}`);

        // Note: In a real application, you would have rollback scripts
        // For now, we'll just remove the migration record
        await db.query(
          `DELETE FROM ${this.migrationsTable} WHERE version = $1`,
          [migration.version]
        );

        console.log(`✅ Migration rolled back: ${migration.version}_${migration.name}`);
      }

      console.log('🎉 Rollback completed successfully!');

    } catch (error) {
      console.error('❌ Rollback process failed:', error.message);
      process.exit(1);
    } finally {
      const factory = DatabaseFactory.getInstance();
      const db = factory.getDefaultAdapter();
      await db.disconnect();
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.runMigrations();
}

module.exports = MigrationRunner;
