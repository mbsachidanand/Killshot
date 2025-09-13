/**
 * Database Reset Script
 * Drops all tables and recreates them with fresh data
 */

import { DatabaseFactory } from './DatabaseFactory';
import { DatabaseAdapter } from './abstract/DatabaseAdapter';
import MigrationRunner from './migrate';
import DatabaseSeeder from './seed';

class DatabaseReset {
  private migrationRunner: MigrationRunner;
  private seeder: DatabaseSeeder;

  constructor() {
    this.migrationRunner = new MigrationRunner();
    this.seeder = new DatabaseSeeder();
  }

  /**
   * Drop all tables
   */
  private async dropAllTables(db: DatabaseAdapter): Promise<void> {
    console.log('🗑️  Dropping all tables...');

    const tables = [
      'expense_splits',
      'expenses',
      'group_members',
      'groups',
      'members',
      'schema_migrations'
    ];

    for (const table of tables) {
      try {
        await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop table ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Reset the entire database
   */
  async reset(): Promise<void> {
    console.log('🔄 Starting database reset...');

    try {
      const factory = DatabaseFactory.getInstance();
      const db = factory.getDefaultAdapter();
      await db.connect();

      // Drop all tables
      await this.dropAllTables(db);

      console.log('✅ Database reset completed');

    } catch (error) {
      console.error('❌ Database reset failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    } finally {
      const factory = DatabaseFactory.getInstance();
      const db = factory.getDefaultAdapter();
      await db.disconnect();
    }
  }

  /**
   * Reset and rebuild the database
   */
  async resetAndRebuild(): Promise<void> {
    console.log('🔄 Starting complete database reset and rebuild...');

    try {
      // Reset database
      await this.reset();

      // Run migrations
      await this.migrationRunner.migrate();

      // Seed data
      await this.seeder.seed();

      console.log('🎉 Database reset and rebuild completed successfully!');

    } catch (error) {
      console.error('❌ Database reset and rebuild failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  const reset = new DatabaseReset();

  const args = process.argv.slice(2);
  if (args.includes('--rebuild')) {
    reset.resetAndRebuild()
      .then(() => {
        console.log('🎉 Reset and rebuild process completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Reset and rebuild process failed:', error);
        process.exit(1);
      });
  } else {
    reset.reset()
      .then(() => {
        console.log('🎉 Reset process completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Reset process failed:', error);
        process.exit(1);
      });
  }
}

export default DatabaseReset;
