/**
 * Database Migration Runner
 * Runs database migrations in order
 */

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseFactory } from './DatabaseFactory';
import { DatabaseAdapter } from './abstract/DatabaseAdapter';

interface Migration {
  version: string;
  name: string;
  file: string;
}

class MigrationRunner {
  private migrationsPath: string;
  private migrationsTable: string;

  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.migrationsTable = 'schema_migrations';
  }

  /**
   * Initialize the migration runner
   */
  async initialize(): Promise<DatabaseAdapter> {
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
  getMigrationFiles(): Migration[] {
    if (!fs.existsSync(this.migrationsPath)) {
      return [];
    }

    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const match = file.match(/^(\d+)_(.+)\.sql$/);
        if (!match || !match[1] || !match[2]) {
          throw new Error(`Invalid migration file name: ${file}`);
        }
        return {
          version: match[1],
          name: match[2].replace(/_/g, ' '),
          file: file
        };
      })
      .sort((a, b) => parseInt(a.version) - parseInt(b.version));
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(db: DatabaseAdapter): Promise<string[]> {
    const result = await db.query(`SELECT version FROM ${this.migrationsTable} ORDER BY version`);
    return result.rows.map((row: any) => row.version);
  }

  /**
   * Mark migration as executed
   */
  async markMigrationExecuted(db: DatabaseAdapter, version: string, name: string): Promise<void> {
    await db.query(
      `INSERT INTO ${this.migrationsTable} (version, name) VALUES ($1, $2)`,
      [version, name]
    );
  }

  /**
   * Mark migration as not executed (for rollback)
   */
  async markMigrationNotExecuted(db: DatabaseAdapter, version: string): Promise<void> {
    await db.query(
      `DELETE FROM ${this.migrationsTable} WHERE version = $1`,
      [version]
    );
  }

  /**
   * Run a single migration
   */
  async runMigration(db: DatabaseAdapter, migration: Migration): Promise<void> {
    const filePath = path.join(this.migrationsPath, migration.file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);

    try {
      await db.query(sql);
      await this.markMigrationExecuted(db, migration.version, migration.name);
      console.log(`✅ Migration ${migration.version} completed`);
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback a single migration
   */
  async rollbackMigration(db: DatabaseAdapter, migration: Migration): Promise<void> {
    console.log(`🔄 Rolling back migration ${migration.version}: ${migration.name}`);

    try {
      // Note: This is a simplified rollback - in a real app, you'd want proper down migrations
      await this.markMigrationNotExecuted(db, migration.version);
      console.log(`✅ Migration ${migration.version} rolled back`);
    } catch (error) {
      console.error(`❌ Rollback of migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    try {
      const db = await this.initialize();
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations(db);

      console.log(`📋 Found ${migrationFiles.length} migration files`);
      console.log(`✅ ${executedMigrations.length} migrations already executed`);

      const pendingMigrations = migrationFiles.filter(
        migration => !executedMigrations.includes(migration.version)
      );

      if (pendingMigrations.length === 0) {
        console.log('🎉 No pending migrations to run');
        return;
      }

      console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);

      for (const migration of pendingMigrations) {
        await this.runMigration(db, migration);
      }

      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('💥 Migration failed:', error);
      throw error;
    } finally {
      const factory = DatabaseFactory.getInstance();
      const db = factory.getDefaultAdapter();
      await db.disconnect();
    }
  }

  /**
   * Rollback the last migration
   */
  async rollback(): Promise<void> {
    try {
      const db = await this.initialize();
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations(db);

      if (executedMigrations.length === 0) {
        console.log('🎉 No migrations to rollback');
        return;
      }

      const lastMigration = migrationFiles.find(
        migration => migration.version === executedMigrations[executedMigrations.length - 1]
      );

      if (!lastMigration) {
        console.log('🎉 No migration found to rollback');
        return;
      }

      await this.rollbackMigration(db, lastMigration);
      console.log('🎉 Rollback completed successfully!');
    } catch (error) {
      console.error('💥 Rollback failed:', error);
      throw error;
    } finally {
      const factory = DatabaseFactory.getInstance();
      const db = factory.getDefaultAdapter();
      await db.disconnect();
    }
  }

  /**
   * Show migration status
   */
  async status(): Promise<void> {
    try {
      const db = await this.initialize();
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations(db);

      console.log('📊 Migration Status:');
      console.log('==================');

      for (const migration of migrationFiles) {
        const isExecuted = executedMigrations.includes(migration.version);
        const status = isExecuted ? '✅' : '⏳';
        console.log(`${status} ${migration.version}: ${migration.name}`);
      }

      console.log(`\n📈 Summary: ${executedMigrations.length}/${migrationFiles.length} migrations executed`);
    } catch (error) {
      console.error('💥 Status check failed:', error);
      throw error;
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
  const command = process.argv[2] || 'migrate';

  switch (command) {
    case 'migrate':
      runner.migrate()
        .then(() => {
          console.log('🎉 Migration process completed!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Migration process failed:', error);
          process.exit(1);
        });
      break;

    case 'rollback':
      runner.rollback()
        .then(() => {
          console.log('🎉 Rollback process completed!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Rollback process failed:', error);
          process.exit(1);
        });
      break;

    case 'status':
      runner.status()
        .then(() => {
          console.log('🎉 Status check completed!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Status check failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('Usage: node migrate.js [migrate|rollback|status]');
      process.exit(1);
  }
}

export default MigrationRunner;
