/**
 * Database Seed Script
 * Populates the database with initial sample data
 */

const databaseFactory = require('./DatabaseFactory');

class DatabaseSeeder {
  constructor() {
    this.sampleMembers = [
      { id: '1', name: 'Rishab', email: 'rishab@example.com' },
      { id: '2', name: 'Sarah', email: 'sarah@example.com' },
      { id: '3', name: 'Alex', email: 'alex@example.com' },
      { id: '4', name: 'Emma', email: 'emma@example.com' },
      { id: '5', name: 'John', email: 'john@example.com' },
      { id: '6', name: 'Lisa', email: 'lisa@example.com' },
      { id: '7', name: 'Mike', email: 'mike@example.com' },
      { id: '8', name: 'Anna', email: 'anna@example.com' },
      { id: '9', name: 'David', email: 'david@example.com' },
      { id: '10', name: 'Sophie', email: 'sophie@example.com' }
    ];

    this.sampleGroups = [
      {
        id: '1',
        name: 'Weekend Trip',
        description: 'Friends going on a weekend getaway',
        memberIds: ['1', '2', '3', '4']
      },
      {
        id: '2',
        name: 'Office Lunch',
        description: 'Team lunch expenses',
        memberIds: ['5', '6', '7']
      },
      {
        id: '3',
        name: 'House Sharing',
        description: 'Shared household expenses',
        memberIds: ['8', '9', '10']
      },
      {
        id: '4',
        name: 'Gym Membership',
        description: 'Shared gym membership costs',
        memberIds: ['1', '5', '8']
      }
    ];

    this.sampleExpenses = [
      {
        id: 'expense_1',
        title: 'Dinner at Restaurant',
        amount: 1200.00,
        paidBy: '1',
        groupId: '1',
        splitType: 'equal',
        date: '2024-09-01T19:30:00.000Z',
        description: 'Group dinner at the new Italian restaurant',
        splits: [
          { memberId: '1', amount: 300.00, percentage: 25.00 },
          { memberId: '2', amount: 300.00, percentage: 25.00 },
          { memberId: '3', amount: 300.00, percentage: 25.00 },
          { memberId: '4', amount: 300.00, percentage: 25.00 }
        ]
      },
      {
        id: 'expense_2',
        title: 'Gas for Road Trip',
        amount: 800.00,
        paidBy: '2',
        groupId: '1',
        splitType: 'equal',
        date: '2024-09-02T08:00:00.000Z',
        description: 'Fuel for the weekend road trip',
        splits: [
          { memberId: '1', amount: 200.00, percentage: 25.00 },
          { memberId: '2', amount: 200.00, percentage: 25.00 },
          { memberId: '3', amount: 200.00, percentage: 25.00 },
          { memberId: '4', amount: 200.00, percentage: 25.00 }
        ]
      },
      {
        id: 'expense_3',
        title: 'Office Lunch',
        amount: 450.00,
        paidBy: '5',
        groupId: '2',
        splitType: 'equal',
        date: '2024-09-03T12:30:00.000Z',
        description: 'Team lunch at the office cafeteria',
        splits: [
          { memberId: '5', amount: 150.00, percentage: 33.33 },
          { memberId: '6', amount: 150.00, percentage: 33.33 },
          { memberId: '7', amount: 150.00, percentage: 33.34 }
        ]
      }
    ];
  }

  /**
   * Clear all existing data
   */
  async clearData(db) {
    console.log('🧹 Clearing existing data...');
    
    // Delete in reverse order due to foreign key constraints
    await db.query('DELETE FROM expense_splits');
    await db.query('DELETE FROM expenses');
    await db.query('DELETE FROM group_members');
    await db.query('DELETE FROM groups');
    await db.query('DELETE FROM members');
    
    console.log('✅ Existing data cleared');
  }

  /**
   * Seed members
   */
  async seedMembers(db) {
    console.log('👥 Seeding members...');
    
    for (const member of this.sampleMembers) {
      await db.insert('members', member);
    }
    
    console.log(`✅ Seeded ${this.sampleMembers.length} members`);
  }

  /**
   * Seed groups
   */
  async seedGroups(db) {
    console.log('👥 Seeding groups...');
    
    for (const group of this.sampleGroups) {
      const { memberIds, ...groupData } = group;
      await db.insert('groups', groupData);
      
      // Add group members
      for (const memberId of memberIds) {
        await db.insert('group_members', {
          group_id: group.id,
          member_id: memberId
        });
      }
    }
    
    console.log(`✅ Seeded ${this.sampleGroups.length} groups`);
  }

  /**
   * Seed expenses
   */
  async seedExpenses(db) {
    console.log('💰 Seeding expenses...');
    
    for (const expense of this.sampleExpenses) {
      const { splits, ...expenseData } = expense;
      await db.insert('expenses', expenseData);
      
      // Add expense splits
      for (const split of splits) {
        await db.insert('expense_splits', {
          expense_id: expense.id,
          member_id: split.memberId,
          amount: split.amount,
          percentage: split.percentage
        });
      }
    }
    
    console.log(`✅ Seeded ${this.sampleExpenses.length} expenses`);
  }

  /**
   * Run all seed operations
   */
  async seed() {
    console.log('🌱 Starting database seeding...');
    
    try {
      const db = await databaseFactory.getAdapter();
      
      // Clear existing data
      await this.clearData(db);
      
      // Seed data in order
      await this.seedMembers(db);
      await this.seedGroups(db);
      await this.seedExpenses(db);
      
      console.log('🎉 Database seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error.message);
      process.exit(1);
    } finally {
      await databaseFactory.disconnect();
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.seed();
}

module.exports = DatabaseSeeder;
