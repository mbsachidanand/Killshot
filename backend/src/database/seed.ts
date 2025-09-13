/**
 * Database Seed Script
 * Populates the database with initial sample data
 */

import { DatabaseFactory } from './DatabaseFactory';
import { DatabaseAdapter } from './abstract/DatabaseAdapter';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  groupId: string;
  splitType: string;
  date: string;
  description: string;
  splits: Array<{
    memberId: string;
    amount: number;
    percentage: number;
  }>;
}

class DatabaseSeeder {
  private sampleMembers: Member[] = [
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

  private sampleGroups: Group[] = [
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

  private sampleExpenses: Expense[] = [
    {
      id: 'expense_1',
      title: 'Dinner at Restaurant',
      amount: 1200.00,
      paidBy: '1',
      groupId: '1',
      splitType: 'equal',
      date: '2025-09-13T19:00:00.000Z',
      description: 'Group dinner at a nice restaurant',
      splits: [
        { memberId: '1', amount: 300.00, percentage: 25.0 },
        { memberId: '2', amount: 300.00, percentage: 25.0 },
        { memberId: '3', amount: 300.00, percentage: 25.0 },
        { memberId: '4', amount: 300.00, percentage: 25.0 }
      ]
    },
    {
      id: 'expense_2',
      title: 'Petrol for Road Trip',
      amount: 800.00,
      paidBy: '2',
      groupId: '1',
      splitType: 'equal',
      date: '2025-09-13T10:00:00.000Z',
      description: 'Fuel for the weekend road trip',
      splits: [
        { memberId: '1', amount: 200.00, percentage: 25.0 },
        { memberId: '2', amount: 200.00, percentage: 25.0 },
        { memberId: '3', amount: 200.00, percentage: 25.0 },
        { memberId: '4', amount: 200.00, percentage: 25.0 }
      ]
    },
    {
      id: 'expense_3',
      title: 'Office Lunch',
      amount: 450.00,
      paidBy: '5',
      groupId: '2',
      splitType: 'equal',
      date: '2025-09-13T12:30:00.000Z',
      description: 'Team lunch at office cafeteria',
      splits: [
        { memberId: '5', amount: 150.00, percentage: 33.33 },
        { memberId: '6', amount: 150.00, percentage: 33.33 },
        { memberId: '7', amount: 150.00, percentage: 33.34 }
      ]
    },
    {
      id: 'expense_4',
      title: 'Grocery Shopping',
      amount: 1200.00,
      paidBy: '8',
      groupId: '3',
      splitType: 'equal',
      date: '2025-09-13T18:00:00.000Z',
      description: 'Weekly grocery shopping for the house',
      splits: [
        { memberId: '8', amount: 400.00, percentage: 33.33 },
        { memberId: '9', amount: 400.00, percentage: 33.33 },
        { memberId: '10', amount: 400.00, percentage: 33.34 }
      ]
    },
    {
      id: 'expense_5',
      title: 'Gym Membership Fee',
      amount: 1500.00,
      paidBy: '1',
      groupId: '4',
      splitType: 'equal',
      date: '2025-09-13T08:00:00.000Z',
      description: 'Monthly gym membership split',
      splits: [
        { memberId: '1', amount: 500.00, percentage: 33.33 },
        { memberId: '5', amount: 500.00, percentage: 33.33 },
        { memberId: '8', amount: 500.00, percentage: 33.34 }
      ]
    }
  ];

  async seed(): Promise<void> {
    try {
      const factory = DatabaseFactory.getInstance();
      const db = factory.getDefaultAdapter();
      await db.connect();

      console.log('🌱 Starting database seeding...');

      // Clear existing data
      await this.clearData(db);

      // Seed members
      await this.seedMembers(db);

      // Seed groups
      await this.seedGroups(db);

      // Seed group memberships
      await this.seedGroupMemberships(db);

      // Seed expenses
      await this.seedExpenses(db);

      // Seed expense splits
      await this.seedExpenseSplits(db);

      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      const factory = DatabaseFactory.getInstance();
      const db = factory.getDefaultAdapter();
      await db.disconnect();
    }
  }

  private async clearData(db: DatabaseAdapter): Promise<void> {
    console.log('🧹 Clearing existing data...');

    await db.query('DELETE FROM expense_splits');
    await db.query('DELETE FROM expenses');
    await db.query('DELETE FROM group_members');
    await db.query('DELETE FROM groups');
    await db.query('DELETE FROM members');

    console.log('✅ Existing data cleared');
  }

  private async seedMembers(db: DatabaseAdapter): Promise<void> {
    console.log('👥 Seeding members...');

    for (const member of this.sampleMembers) {
      await db.query(
        'INSERT INTO members (id, name, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
        [member.id, member.name, member.email, new Date().toISOString(), new Date().toISOString()]
      );
    }

    console.log(`✅ Seeded ${this.sampleMembers.length} members`);
  }

  private async seedGroups(db: DatabaseAdapter): Promise<void> {
    console.log('🏠 Seeding groups...');

    for (const group of this.sampleGroups) {
      await db.query(
        'INSERT INTO groups (id, name, description, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [group.id, group.name, group.description, 'unknown', new Date().toISOString(), new Date().toISOString()]
      );
    }

    console.log(`✅ Seeded ${this.sampleGroups.length} groups`);
  }

  private async seedGroupMemberships(db: DatabaseAdapter): Promise<void> {
    console.log('🔗 Seeding group memberships...');

    for (const group of this.sampleGroups) {
      for (const memberId of group.memberIds) {
        await db.query(
          'INSERT INTO group_members (group_id, member_id, joined_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
          [group.id, memberId, new Date().toISOString(), new Date().toISOString(), new Date().toISOString()]
        );
      }
    }

    console.log('✅ Group memberships seeded');
  }

  private async seedExpenses(db: DatabaseAdapter): Promise<void> {
    console.log('💰 Seeding expenses...');

    for (const expense of this.sampleExpenses) {
      await db.query(
        'INSERT INTO expenses (id, title, amount, paid_by, group_id, split_type, date, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          expense.id,
          expense.title,
          expense.amount,
          expense.paidBy,
          expense.groupId,
          expense.splitType,
          expense.date,
          expense.description,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    }

    console.log(`✅ Seeded ${this.sampleExpenses.length} expenses`);
  }

  private async seedExpenseSplits(db: DatabaseAdapter): Promise<void> {
    console.log('📊 Seeding expense splits...');

    for (const expense of this.sampleExpenses) {
      for (const split of expense.splits) {
        await db.query(
          'INSERT INTO expense_splits (expense_id, member_id, amount, percentage) VALUES ($1, $2, $3, $4)',
          [expense.id, split.memberId, split.amount, split.percentage]
        );
      }
    }

    console.log('✅ Expense splits seeded');
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.seed()
    .then(() => {
      console.log('🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;
