/**
 * Database Reset Script
 * Drops all tables and recreates them with fresh data
 */

const databaseFactory = require('./DatabaseFactory');
const MigrationRunner = require('./migrate');
const DatabaseSeeder = require('./seed');

class DatabaseReset {
  constructor() {
    this.migrationRunner = new MigrationRunner();
    this.seeder = new DatabaseSeeder();
  }

  /**
   * Drop all tables
   */
  async dropAllTables(db) {
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
        console.log(`⚠️  Could not drop table ${table}: ${error.message}`);
      }
    }
  }

  /**
   * Reset the entire database
   */
  async reset() {
    console.log('🔄 Starting database reset...');
    
    try {
      const db = await databaseFactory.getAdapter();
      
      // Drop all tables
      await this.dropAllTables(db);
      
      console.log('✅ Database reset completed');
      
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      process.exit(1);
    } finally {
      await databaseFactory.disconnect();
    }
  }

  /**
   * Reset and rebuild the database
   */
  async resetAndRebuild() {
    console.log('🔄 Starting complete database reset and rebuild...');
    
    try {
      // Reset database
      await this.reset();
      
      // Run migrations
      await this.migrationRunner.runMigrations();
      
      // Seed data
      await this.seeder.seed();
      
      console.log('🎉 Database reset and rebuild completed successfully!');
      
    } catch (error) {
      console.error('❌ Database reset and rebuild failed:', error.message);
      process.exit(1);
    }
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  const reset = new DatabaseReset();
  
  const args = process.argv.slice(2);
  if (args.includes('--rebuild')) {
    reset.resetAndRebuild();
  } else {
    reset.reset();
  }
}

module.exports = DatabaseReset;
