/**
 * Expense Service with Database Integration
 * Handles business logic for expense operations using PostgreSQL database
 *
 * Features:
 * - Full TypeScript type safety
 * - Database-backed operations (replaces in-memory storage)
 * - Comprehensive error handling
 * - Support for complex expense splitting logic
 */

import { DatabaseFactory } from '../database/DatabaseFactory';
import { DatabaseAdapter } from '../database/abstract/DatabaseAdapter';
import { Expense, SplitDetail } from '../types';

interface ExpenseData {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  group_id: string;
  split_type: string;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface CreateExpenseData {
  title: string;
  amount: number;
  paidBy: string;
  groupId: string;
  splitType?: string;
  date?: string;
  description?: string;
  splitDetails?: SplitDetail[];
}

interface UpdateExpenseData {
  title?: string;
  amount?: number;
  paidBy?: string;
  splitType?: string;
  date?: string;
  description?: string;
  splitDetails?: SplitDetail[];
}

interface SplitData {
  userId: string;
  userName: string;
  amount: number;
  percentage: number;
}

interface GroupStats {
  totalAmount: number;
  expenseCount: number;
  balances: Record<string, number>;
  expenses: Expense[];
}

interface Participant {
  id: string;
  name: string;
}

export class ExpenseServiceDB {
  private db: DatabaseAdapter | null = null;

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    if (!this.db) {
      const factory = DatabaseFactory.getInstance();
      this.db = factory.getDefaultAdapter();
      await this.db.connect();
    }
  }

  /**
   * Create a new expense
   */
  async createExpense(expenseData: CreateExpenseData): Promise<Expense> {
    try {
      await this.initialize();

      const { title, amount, paidBy, groupId, splitType, date, description, splitDetails } = expenseData;

      // Validate required fields
      const validationErrors = this.validateExpenseData(expenseData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const expenseId = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create expense using raw SQL
      const expenseQuery = `
        INSERT INTO expenses (id, title, amount, paid_by, group_id, split_type, date, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const now = new Date().toISOString();
      const expense = await this.db!.query(expenseQuery, [
        expenseId,
        title.trim(),
        parseFloat(amount.toString()),
        paidBy,
        groupId,
        splitType || 'equal',
        date || now,
        description || '',
        now,
        now
      ]);

      // Create expense splits using raw SQL
      if (splitDetails && splitDetails.length > 0) {
        for (const split of splitDetails) {
          const splitQuery = `
            INSERT INTO expense_splits (expense_id, member_id, amount, percentage)
            VALUES ($1, $2, $3, $4)
          `;
          await this.db!.query(splitQuery, [
            expenseId,
            split.userId,
            parseFloat(split.amount.toString()),
            parseFloat(split.percentage.toString())
          ]);
        }
      }

      return await this.getExpenseById(expenseId);
    } catch (error) {
      throw new Error(`Failed to create expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all expenses
   */
  async getAllExpenses(): Promise<Expense[]> {
    try {
      await this.initialize();

      const expensesQuery = `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.paid_by,
          e.group_id,
          e.split_type,
          e.date,
          e.description,
          e.created_at,
          e.updated_at
        FROM expenses e
        ORDER BY e.created_at DESC
      `;

      const result = await this.db!.query(expensesQuery);
      const expenses = result.rows || [];

      // Get split details for each expense
      for (const expense of expenses) {
        expense.splitDetails = await this.getExpenseSplits(expense.id);
      }

      return expenses as Expense[];
    } catch (error) {
      throw new Error(`Failed to fetch expenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get expenses by group ID
   */
  async getExpensesByGroup(groupId: string): Promise<Expense[]> {
    try {
      await this.initialize();

      const expensesQuery = `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.paid_by,
          e.group_id,
          e.split_type,
          e.date,
          e.description,
          e.created_at,
          e.updated_at
        FROM expenses e
        WHERE e.group_id = $1
        ORDER BY e.created_at DESC
      `;

      const result = await this.db!.query(expensesQuery, [groupId]);
      const expenses = result.rows || [];

      // Get split details for each expense
      for (const expense of expenses) {
        expense.splitDetails = await this.getExpenseSplits(expense.id);
      }

      return expenses as Expense[];
    } catch (error) {
      throw new Error(`Failed to fetch group expenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(expenseId: string): Promise<Expense> {
    try {
      await this.initialize();

      const expenseQuery = `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.paid_by,
          e.group_id,
          e.split_type,
          e.date,
          e.description,
          e.created_at,
          e.updated_at
        FROM expenses e
        WHERE e.id = $1
      `;

      const result = await this.db!.query(expenseQuery, [expenseId]);
      const expenseData = result.rows && result.rows.length > 0 ? result.rows[0] : null;
      if (!expenseData) {
        throw new Error(`Expense with ID ${expenseId} not found`);
      }

      // Get split details
      const splitDetails = await this.getExpenseSplits(expenseId);

      // Create Expense object
      const expense: Expense = {
        id: expenseData.id,
        title: expenseData.title,
        amount: parseFloat(expenseData.amount.toString()),
        paidBy: expenseData.paid_by,
        groupId: expenseData.group_id,
        splitType: expenseData.split_type,
        splits: splitDetails,
        date: expenseData.date,
        description: expenseData.description,
        createdAt: expenseData.created_at,
        updatedAt: expenseData.updated_at
      };

      return expense;
    } catch (error) {
      throw new Error(`Failed to fetch expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get expense splits
   */
  async getExpenseSplits(expenseId: string): Promise<SplitDetail[]> {
    try {
      await this.initialize();

      const splitsQuery = `
        SELECT
          es.member_id as user_id,
          m.name as user_name,
          es.amount,
          es.percentage
        FROM expense_splits es
        JOIN members m ON es.member_id = m.id
        WHERE es.expense_id = $1
        ORDER BY es.amount DESC
      `;

      const result = await this.db!.query(splitsQuery, [expenseId]);
      return result.rows || [];
    } catch (error) {
      throw new Error(`Failed to fetch expense splits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an expense
   */
  async updateExpense(expenseId: string, updateData: UpdateExpenseData): Promise<Expense> {
    try {
      await this.initialize();

      const { title, amount, paidBy, splitType, date, description, splitDetails } = updateData;

      // Validate update data
      const validationErrors = this.validateExpenseData(updateData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        updateFields.push(`title = $${paramCount++}`);
        values.push(title.trim());
      }
      if (amount !== undefined) {
        updateFields.push(`amount = $${paramCount++}`);
        values.push(parseFloat(amount.toString()));
      }
      if (paidBy !== undefined) {
        updateFields.push(`paid_by = $${paramCount++}`);
        values.push(paidBy);
      }
      if (splitType !== undefined) {
        updateFields.push(`split_type = $${paramCount++}`);
        values.push(splitType);
      }
      if (date !== undefined) {
        updateFields.push(`date = $${paramCount++}`);
        values.push(date);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(description);
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = $${paramCount++}`);
        values.push(new Date().toISOString());
        values.push(expenseId);

        const updateQuery = `
          UPDATE expenses
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `;

        const result = await this.db!.query(updateQuery, values);
        if (!result.rows || result.rows.length === 0) {
          throw new Error(`Expense with ID ${expenseId} not found`);
        }
      }

      // Update splits if provided
      if (splitDetails && splitDetails.length > 0) {
        // Delete existing splits
        await this.db!.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);

        // Insert new splits
        for (const split of splitDetails) {
          const splitQuery = `
            INSERT INTO expense_splits (expense_id, member_id, amount, percentage)
            VALUES ($1, $2, $3, $4)
          `;
          await this.db!.query(splitQuery, [
            expenseId,
            split.userId,
            parseFloat(split.amount.toString()),
            parseFloat(split.percentage.toString())
          ]);
        }
      }

      return await this.getExpenseById(expenseId);
    } catch (error) {
      throw new Error(`Failed to update expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string): Promise<Expense> {
    try {
      await this.initialize();

      const expense = await this.getExpenseById(expenseId);

      // Delete expense (splits will be deleted due to CASCADE)
      await this.db!.query('DELETE FROM expenses WHERE id = $1', [expenseId]);

      return expense;
    } catch (error) {
      throw new Error(`Failed to delete expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get expenses by user ID
   */
  async getExpensesByUser(userId: string): Promise<Expense[]> {
    try {
      await this.initialize();

      const expensesQuery = `
        SELECT DISTINCT
          e.id,
          e.title,
          e.amount,
          e.paid_by,
          e.group_id,
          e.split_type,
          e.date,
          e.description,
          e.created_at,
          e.updated_at
        FROM expenses e
        LEFT JOIN expense_splits es ON e.id = es.expense_id
        WHERE e.paid_by = $1 OR es.member_id = $1
        ORDER BY e.created_at DESC
      `;

      const result = await this.db!.query(expensesQuery, [userId]);
      const expenses = result.rows || [];

      // Get split details for each expense
      for (const expense of expenses) {
        expense.splitDetails = await this.getExpenseSplits(expense.id);
      }

      return expenses as Expense[];
    } catch (error) {
      throw new Error(`Failed to fetch user expenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get expense statistics for a group
   */
  async getGroupExpenseStats(groupId: string): Promise<GroupStats> {
    try {
      await this.initialize();

      const statsQuery = `
        SELECT
          COUNT(*) as expense_count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM expenses
        WHERE group_id = $1
      `;

      const statsResult = await this.db!.query(statsQuery, [groupId]);
      const stats = statsResult.rows && statsResult.rows.length > 0 ? statsResult.rows[0] : { expense_count: 0, total_amount: 0 };

      // Calculate balances
      const balancesQuery = `
        SELECT
          m.id as user_id,
          m.name as user_name,
          COALESCE(SUM(
            CASE
              WHEN e.paid_by = m.id THEN e.amount
              ELSE 0
            END
          ), 0) as paid_amount,
          COALESCE(SUM(es.amount), 0) as owed_amount
        FROM members m
        JOIN group_members gm ON m.id = gm.member_id
        LEFT JOIN expenses e ON gm.group_id = e.group_id
        LEFT JOIN expense_splits es ON e.id = es.expense_id AND es.member_id = m.id
        WHERE gm.group_id = $1
        GROUP BY m.id, m.name
      `;

      const balancesResult = await this.db!.query(balancesQuery, [groupId]);
      const balances = balancesResult.rows || [];

      // Calculate net balance for each user
      const userBalances: Record<string, number> = {};
      balances.forEach((balance: any) => {
        userBalances[balance.user_id] = balance.paid_amount - balance.owed_amount;
      });

      // Get all expenses for the group
      const expenses = await this.getExpensesByGroup(groupId);

      return {
        totalAmount: parseFloat(stats.total_amount.toString()),
        expenseCount: parseInt(stats.expense_count.toString()),
        balances: userBalances,
        expenses: expenses
      };
    } catch (error) {
      throw new Error(`Failed to get group expense stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate equal split for a group
   */
  async calculateEqualSplit(groupId: string, amount: number, participants: Participant[]): Promise<SplitData[]> {
    try {
      await this.initialize();

      if (!participants || participants.length === 0) {
        throw new Error('Participants list is required');
      }

      const amountPerPerson = amount / participants.length;

      return participants.map(participant => ({
        userId: participant.id,
        userName: participant.name,
        amount: Math.round(amountPerPerson * 100) / 100,
        percentage: Math.round((100 / participants.length) * 100) / 100
      }));
    } catch (error) {
      throw new Error(`Failed to calculate equal split: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search expenses by title or description
   */
  async searchExpenses(query: string): Promise<Expense[]> {
    try {
      await this.initialize();

      const searchQuery = `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.paid_by,
          e.group_id,
          e.split_type,
          e.date,
          e.description,
          e.created_at,
          e.updated_at
        FROM expenses e
        WHERE e.title ILIKE $1 OR e.description ILIKE $1
        ORDER BY e.created_at DESC
      `;

      const result = await this.db!.query(searchQuery, [`%${query}%`]);
      const expenses = result.rows || [];

      // Get split details for each expense
      for (const expense of expenses) {
        expense.splitDetails = await this.getExpenseSplits(expense.id);
      }

      return expenses as Expense[];
    } catch (error) {
      throw new Error(`Failed to search expenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get expenses by date range
   */
  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      await this.initialize();

      const expensesQuery = `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.paid_by,
          e.group_id,
          e.split_type,
          e.date,
          e.description,
          e.created_at,
          e.updated_at
        FROM expenses e
        WHERE e.date >= $1 AND e.date <= $2
        ORDER BY e.created_at DESC
      `;

      const result = await this.db!.query(expensesQuery, [startDate, endDate]);
      const expenses = result.rows || [];

      // Get split details for each expense
      for (const expense of expenses) {
        expense.splitDetails = await this.getExpenseSplits(expense.id);
      }

      return expenses as Expense[];
    } catch (error) {
      throw new Error(`Failed to fetch expenses by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate expense data
   */
  validateExpenseData(expenseData: Partial<CreateExpenseData>): string[] {
    const errors: string[] = [];

    if (expenseData.title !== undefined && (!expenseData.title || expenseData.title.trim() === '')) {
      errors.push('Title is required');
    }

    if (expenseData.amount !== undefined && (!expenseData.amount || isNaN(expenseData.amount) || parseFloat(expenseData.amount.toString()) <= 0)) {
      errors.push('Amount must be a positive number');
    }

    if (expenseData.paidBy !== undefined && (!expenseData.paidBy || expenseData.paidBy.trim() === '')) {
      errors.push('Paid by user ID is required');
    }

    if (expenseData.groupId !== undefined && (!expenseData.groupId || expenseData.groupId.trim() === '')) {
      errors.push('Group ID is required');
    }

    if (expenseData.splitType !== undefined && !['equal', 'exact', 'percentage'].includes(expenseData.splitType)) {
      errors.push('Invalid split type. Must be equal, exact, or percentage');
    }

    return errors;
  }
}

export default ExpenseServiceDB;
