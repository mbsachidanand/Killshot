/**
 * Expense Service
 * Handles business logic for expense operations
 *
 * @fileoverview TypeScript implementation of the Expense service with full type safety
 */

import ExpenseModel from '@/models/Expense';
import {
    CreateExpenseRequest,
    Expense,
    Service,
    UpdateExpenseRequest
} from '@/types';

/**
 * Expense statistics interface
 */
export interface ExpenseStats {
  totalAmount: number;
  expenseCount: number;
  balances: Record<string, number>;
  expenses: Array<{
    id: string;
    title: string;
    amount: number;
    paidBy: string;
    groupId: string;
    splitType: string;
    date: Date;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

/**
 * Participant interface for split calculations
 */
export interface Participant {
  id: string;
  name: string;
  email?: string;
}

/**
 * Split calculation result
 */
export interface SplitCalculation {
  userId: string;
  userName: string;
  amount: number;
  percentage: number;
}

/**
 * Expense Service Class
 *
 * This class handles all business logic for expense operations including
 * CRUD operations, split calculations, and expense statistics.
 */
export class ExpenseService implements Service<Expense, CreateExpenseRequest, UpdateExpenseRequest> {
  private expenses: Map<string, ExpenseModel>;

  constructor() {
    try {
      // In-memory storage for expenses
      this.expenses = new Map();
      console.log('ExpenseService constructor: Map created');
      this.initializeSampleData();
      console.log('ExpenseService constructor: Sample data initialized, expenses size:', this.expenses.size);
    } catch (error) {
      console.error('Error in ExpenseService constructor:', error);
      throw error;
    }
  }

  /**
   * Initialize with sample expense data
   *
   * @private
   */
  private initializeSampleData(): void {
    const sampleExpenses: Array<{
      id: string;
      title: string;
      amount: number;
      paidBy: string;
      groupId: string;
      splitType: 'equal' | 'exact' | 'percentage';
      date: string;
      description: string;
      splits: Array<{
        id: string;
        expenseId: string;
        userId: string;
        amount: number;
        isPaid: boolean;
        paidAt?: Date;
      }>;
    }> = [
      {
        id: 'expense_1',
        title: 'Dinner at Restaurant',
        amount: 1200.00,
        paidBy: '1', // Rishab
        groupId: '1', // Weekend Trip
        splitType: 'equal',
        date: '2024-09-01T19:30:00.000Z',
        description: 'Group dinner at the new Italian restaurant',
        splits: [
          { id: 'split_1_1', expenseId: 'expense_1', userId: '1', amount: 300.00, isPaid: false },
          { id: 'split_1_2', expenseId: 'expense_1', userId: '2', amount: 300.00, isPaid: false },
          { id: 'split_1_3', expenseId: 'expense_1', userId: '3', amount: 300.00, isPaid: false },
          { id: 'split_1_4', expenseId: 'expense_1', userId: '4', amount: 300.00, isPaid: false }
        ]
      },
      {
        id: 'expense_2',
        title: 'Gas for Road Trip',
        amount: 800.00,
        paidBy: '2', // Sarah
        groupId: '1', // Weekend Trip
        splitType: 'equal',
        date: '2024-09-02T08:00:00.000Z',
        description: 'Fuel for the weekend road trip',
        splits: [
          { id: 'split_2_1', expenseId: 'expense_2', userId: '1', amount: 200.00, isPaid: false },
          { id: 'split_2_2', expenseId: 'expense_2', userId: '2', amount: 200.00, isPaid: false },
          { id: 'split_2_3', expenseId: 'expense_2', userId: '3', amount: 200.00, isPaid: false },
          { id: 'split_2_4', expenseId: 'expense_2', userId: '4', amount: 200.00, isPaid: false }
        ]
      },
      {
        id: 'expense_3',
        title: 'Office Lunch',
        amount: 450.00,
        paidBy: '5', // John
        groupId: '2', // Office Lunch
        splitType: 'equal',
        date: '2024-09-03T12:30:00.000Z',
        description: 'Team lunch at the office cafeteria',
        splits: [
          { id: 'split_3_5', expenseId: 'expense_3', userId: '5', amount: 150.00, isPaid: false },
          { id: 'split_3_6', expenseId: 'expense_3', userId: '6', amount: 150.00, isPaid: false },
          { id: 'split_3_7', expenseId: 'expense_3', userId: '7', amount: 150.00, isPaid: false }
        ]
      }
    ];

    sampleExpenses.forEach(expenseData => {
      try {
        const expense = new ExpenseModel(expenseData);
        this.expenses.set(expense.id, expense);
      } catch (error) {
        console.error('Error creating sample expense:', error, expenseData);
      }
    });
  }

  /**
   * Create a new expense
   *
   * @param {CreateExpenseRequest} expenseData - Expense data
   * @returns {Promise<Expense>} Created expense
   * @throws {Error} If expense creation fails
   */
  async create(expenseData: CreateExpenseRequest): Promise<Expense> {
    try {
      // Validate expense data
      const validationErrors = this.validateExpenseData(expenseData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const expense = new ExpenseModel(expenseData as any);
      this.expenses.set(expense.id, expense);
      return expense.toJSON();
    } catch (error) {
      throw new Error(`Failed to create expense: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new expense (alias for create for backward compatibility)
   *
   * @param {CreateExpenseRequest} expenseData - Expense data
   * @returns {Promise<Expense>} Created expense
   */
  async createExpense(expenseData: CreateExpenseRequest): Promise<Expense> {
    return this.create(expenseData);
  }

  /**
   * Get all expenses
   *
   * @returns {Promise<Expense[]>} Array of all expenses
   */
  async findAll(): Promise<Expense[]> {
    console.log('ExpenseService.findAll called, expenses size:', this.expenses.size);
    const expensesArray = Array.from(this.expenses.values());
    console.log('Expenses array length:', expensesArray.length);
    return expensesArray.map(expense => expense.toJSON());
  }

  /**
   * Get all expenses (alias for findAll for backward compatibility)
   *
   * @returns {Promise<Expense[]>} Array of all expenses
   */
  async getAllExpenses(): Promise<Expense[]> {
    return this.findAll();
  }

  /**
   * Get expense by ID
   *
   * @param {string} expenseId - Expense ID
   * @returns {Promise<Expense | null>} Expense or null if not found
   * @throws {Error} If fetching expense fails
   */
  async findById(expenseId: string): Promise<Expense | null> {
    try {
      const expense = this.expenses.get(expenseId);
      if (!expense) {
        return null;
      }
      return expense.toJSON();
    } catch (error) {
      throw new Error(`Failed to fetch expense: ${(error as Error).message}`);
    }
  }

  /**
   * Get expense by ID (alias for findById for backward compatibility)
   *
   * @param {string} expenseId - Expense ID
   * @returns {Promise<Expense>} Expense
   * @throws {Error} If expense not found or fetching fails
   */
  async getExpenseById(expenseId: string): Promise<Expense> {
    const expense = await this.findById(expenseId);
    if (!expense) {
      throw new Error(`Expense with ID ${expenseId} not found`);
    }
    return expense;
  }

  /**
   * Update an expense
   *
   * @param {string} expenseId - Expense ID
   * @param {UpdateExpenseRequest} updateData - Data to update
   * @returns {Promise<Expense>} Updated expense
   * @throws {Error} If expense update fails
   */
  async update(expenseId: string, updateData: UpdateExpenseRequest): Promise<Expense> {
    try {
      const expense = this.expenses.get(expenseId);
      if (!expense) {
        throw new Error(`Expense with ID ${expenseId} not found`);
      }

      expense.update(updateData as any);
      return expense.toJSON();
    } catch (error) {
      throw new Error(`Failed to update expense: ${(error as Error).message}`);
    }
  }

  /**
   * Update an expense (alias for update for backward compatibility)
   *
   * @param {string} expenseId - Expense ID
   * @param {UpdateExpenseRequest} updateData - Data to update
   * @returns {Promise<Expense>} Updated expense
   */
  async updateExpense(expenseId: string, updateData: UpdateExpenseRequest): Promise<Expense> {
    return this.update(expenseId, updateData);
  }

  /**
   * Delete an expense
   *
   * @param {string} expenseId - Expense ID
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If expense deletion fails
   */
  async delete(expenseId: string): Promise<boolean> {
    try {
      const expense = this.expenses.get(expenseId);
      if (!expense) {
        throw new Error(`Expense with ID ${expenseId} not found`);
      }

      this.expenses.delete(expenseId);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete expense: ${(error as Error).message}`);
    }
  }

  /**
   * Delete an expense (alias for delete for backward compatibility)
   *
   * @param {string} expenseId - Expense ID
   * @returns {Promise<Expense>} Deleted expense
   */
  async deleteExpense(expenseId: string): Promise<Expense> {
    const expense = await this.getExpenseById(expenseId);
    await this.delete(expenseId);
    return expense;
  }

  /**
   * Get expenses by group ID
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<Expense[]>} Array of expenses for the group
   */
  async getExpensesByGroup(groupId: string): Promise<Expense[]> {
    try {
      const allExpenses = Array.from(this.expenses.values());
      return allExpenses
        .filter(expense => expense.groupId === groupId)
        .map(expense => expense.toJSON());
    } catch (error) {
      throw new Error(`Failed to get expenses by group: ${(error as Error).message}`);
    }
  }

  /**
   * Get expenses by user ID (expenses where user paid or is involved in split)
   *
   * @param {string} userId - User ID
   * @returns {Promise<Expense[]>} Array of expenses involving the user
   */
  async getExpensesByUser(userId: string): Promise<Expense[]> {
    try {
      const allExpenses = Array.from(this.expenses.values());
      return allExpenses
        .filter(expense => {
          // Check if user paid for the expense
          if (expense.paidBy === userId) {
            return true;
          }

          // Check if user is involved in the split
          return expense.splits.some(split => split.userId === userId);
        })
        .map(expense => expense.toJSON());
    } catch (error) {
      throw new Error(`Failed to get expenses by user: ${(error as Error).message}`);
    }
  }

  /**
   * Get expense statistics for a group
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<ExpenseStats>} Expense statistics
   * @throws {Error} If fetching statistics fails
   */
  async getGroupExpenseStats(groupId: string): Promise<ExpenseStats> {
    try {
      // Get the actual ExpenseModel instances, not the JSON objects
      const allExpenses = Array.from(this.expenses.values());
      const groupExpenseModels = allExpenses.filter(expense => expense.groupId === groupId);

      // Convert to JSON for calculations
      const groupExpenses = groupExpenseModels.map(expense => expense.toJSON());

      const totalAmount = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const expenseCount = groupExpenses.length;

      // Calculate who owes what to whom
      const balances = new Map<string, number>();

      groupExpenses.forEach(expense => {
        // Add amount to the person who paid
        const paidBy = expense.paidBy;
        balances.set(paidBy, (balances.get(paidBy) || 0) + expense.amount);

        // Subtract amount from each person in the split
        expense.splits.forEach(split => {
          balances.set(split.userId, (balances.get(split.userId) || 0) - split.amount);
        });
      });

      return {
        totalAmount,
        expenseCount,
        balances: Object.fromEntries(balances),
        expenses: groupExpenseModels.map(expense => expense.getSummary())
      };
    } catch (error) {
      throw new Error(`Failed to get group expense stats: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate equal split for a group
   *
   * @param {string} groupId - Group ID
   * @param {number} amount - Total amount to split
   * @param {Participant[]} participants - Array of participants
   * @returns {Promise<SplitCalculation[]>} Split calculations
   * @throws {Error} If calculation fails
   */
  async calculateEqualSplit(
    groupId: string,
    amount: number,
    participants: Participant[]
  ): Promise<SplitCalculation[]> {
    try {
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
      throw new Error(`Failed to calculate equal split: ${(error as Error).message}`);
    }
  }

  /**
   * Validate expense data before creation
   *
   * @param {CreateExpenseRequest} expenseData - Expense data to validate
   * @returns {string[]} Array of validation errors
   */
  validateExpenseData(expenseData: CreateExpenseRequest): string[] {
    const errors: string[] = [];

    if (!expenseData.title || expenseData.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!expenseData.amount || isNaN(expenseData.amount) || parseFloat(expenseData.amount.toString()) <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (!expenseData.paidBy || expenseData.paidBy.trim() === '') {
      errors.push('Paid by user ID is required');
    }

    if (!expenseData.groupId || expenseData.groupId.trim() === '') {
      errors.push('Group ID is required');
    }

    if (expenseData.splitType && !['equal', 'exact', 'percentage'].includes(expenseData.splitType)) {
      errors.push('Invalid split type. Must be equal, exact, or percentage');
    }

    return errors;
  }

  /**
   * Search expenses by title or description
   *
   * @param {string} query - Search query
   * @returns {Promise<Expense[]>} Array of matching expenses
   */
  async searchExpenses(query: string): Promise<Expense[]> {
    try {
      const allExpenses = Array.from(this.expenses.values());
      const searchTerm = query.toLowerCase();

      return allExpenses
        .filter(expense =>
          expense.title.toLowerCase().includes(searchTerm) ||
          (expense.description && expense.description.toLowerCase().includes(searchTerm))
        )
        .map(expense => expense.toJSON());
    } catch (error) {
      throw new Error(`Failed to search expenses: ${(error as Error).message}`);
    }
  }

  /**
   * Get expenses by date range
   *
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Expense[]>} Array of expenses in date range
   */
  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    try {
      const allExpenses = Array.from(this.expenses.values());

      return allExpenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        })
        .map(expense => expense.toJSON());
    } catch (error) {
      throw new Error(`Failed to get expenses by date range: ${(error as Error).message}`);
    }
  }

  /**
   * Get total expenses count
   *
   * @returns {Promise<number>} Total number of expenses
   */
  async getExpensesCount(): Promise<number> {
    return this.expenses.size;
  }

  /**
   * Check if expense exists
   *
   * @param {string} expenseId - Expense ID
   * @returns {Promise<boolean>} True if expense exists
   */
  async expenseExists(expenseId: string): Promise<boolean> {
    return this.expenses.has(expenseId);
  }
}

export default ExpenseService;
