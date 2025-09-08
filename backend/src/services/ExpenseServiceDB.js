/**
 * Expense Service with Database Integration
 * Handles business logic for expense operations using database
 */

const databaseFactory = require('../database/DatabaseFactory');

class ExpenseServiceDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    if (!this.db) {
      this.db = await databaseFactory.getAdapter();
    }
  }

  /**
   * Create a new expense
   */
  async createExpense(expenseData) {
    try {
      await this.initialize();
      
      const { title, amount, paidBy, groupId, splitType, date, description, splitDetails } = expenseData;
      
      // Validate required fields
      const validationErrors = this.validateExpenseData(expenseData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      
      const expenseId = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create expense
      const expense = await this.db.insert('expenses', {
        id: expenseId,
        title: title.trim(),
        amount: parseFloat(amount),
        paid_by: paidBy,
        group_id: groupId,
        split_type: splitType || 'equal',
        date: date || new Date().toISOString(),
        description: description || ''
      });
      
      // Create expense splits
      if (splitDetails && splitDetails.length > 0) {
        for (const split of splitDetails) {
          await this.db.insert('expense_splits', {
            expense_id: expenseId,
            member_id: split.userId,
            amount: parseFloat(split.amount),
            percentage: parseFloat(split.percentage)
          });
        }
      }
      
      return await this.getExpenseById(expenseId);
    } catch (error) {
      throw new Error(`Failed to create expense: ${error.message}`);
    }
  }

  /**
   * Get all expenses
   */
  async getAllExpenses() {
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
      
      const expenses = await this.db.getMany(expensesQuery);
      
      // Get split details for each expense
      for (const expense of expenses) {
        expense.splitDetails = await this.getExpenseSplits(expense.id);
      }
      
      return expenses;
    } catch (error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }
  }

  /**
   * Get expenses by group ID
   */
  async getExpensesByGroup(groupId) {
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
      
      const expenses = await this.db.getMany(expensesQuery, [groupId]);
      
      // Get split details for each expense
      for (const expense of expenses) {
        expense.splitDetails = await this.getExpenseSplits(expense.id);
      }
      
      return expenses;
    } catch (error) {
      throw new Error(`Failed to fetch group expenses: ${error.message}`);
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(expenseId) {
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
      
      const expenseData = await this.db.getOne(expenseQuery, [expenseId]);
      if (!expenseData) {
        throw new Error(`Expense with ID ${expenseId} not found`);
      }
      
      // Get split details
      const splitDetails = await this.getExpenseSplits(expenseId);
      
      // Create Expense model instance
      const Expense = require('../models/Expense');
      const expense = new Expense({
        id: expenseData.id,
        title: expenseData.title,
        amount: parseFloat(expenseData.amount),
        paidBy: expenseData.paid_by,
        groupId: expenseData.group_id,
        splitType: expenseData.split_type,
        splitDetails: splitDetails,
        date: expenseData.date,
        description: expenseData.description,
        createdAt: expenseData.created_at,
        updatedAt: expenseData.updated_at
      });
      
      return expense;
    } catch (error) {
      throw new Error(`Failed to fetch expense: ${error.message}`);
    }
  }

  /**
   * Get expense splits
   */
  async getExpenseSplits(expenseId) {
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
      
      return await this.db.getMany(splitsQuery, [expenseId]);
    } catch (error) {
      throw new Error(`Failed to fetch expense splits: ${error.message}`);
    }
  }

  /**
   * Update an expense
   */
  async updateExpense(expenseId, updateData) {
    try {
      await this.initialize();
      
      const { title, amount, paidBy, splitType, date, description, splitDetails } = updateData;
      
      // Validate update data
      const validationErrors = this.validateExpenseData(updateData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      
      const updateFields = {};
      if (title !== undefined) updateFields.title = title.trim();
      if (amount !== undefined) updateFields.amount = parseFloat(amount);
      if (paidBy !== undefined) updateFields.paid_by = paidBy;
      if (splitType !== undefined) updateFields.split_type = splitType;
      if (date !== undefined) updateFields.date = date;
      if (description !== undefined) updateFields.description = description;
      
      if (Object.keys(updateFields).length > 0) {
        const updatedExpense = await this.db.update('expenses', updateFields, { id: expenseId });
        if (!updatedExpense) {
          throw new Error(`Expense with ID ${expenseId} not found`);
        }
      }
      
      // Update splits if provided
      if (splitDetails && splitDetails.length > 0) {
        // Delete existing splits
        await this.db.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);
        
        // Insert new splits
        for (const split of splitDetails) {
          await this.db.insert('expense_splits', {
            expense_id: expenseId,
            member_id: split.userId,
            amount: parseFloat(split.amount),
            percentage: parseFloat(split.percentage)
          });
        }
      }
      
      return await this.getExpenseById(expenseId);
    } catch (error) {
      throw new Error(`Failed to update expense: ${error.message}`);
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId) {
    try {
      await this.initialize();
      
      const expense = await this.getExpenseById(expenseId);
      
      // Delete expense (splits will be deleted due to CASCADE)
      await this.db.delete('expenses', { id: expenseId });
      
      return expense;
    } catch (error) {
      throw new Error(`Failed to delete expense: ${error.message}`);
    }
  }

  /**
   * Get expenses by user ID
   */
  async getExpensesByUser(userId) {
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
      
      const expenses = await this.db.getMany(expensesQuery, [userId]);
      
      // Get split details for each expense
      for (const expense of expenses) {
        expense.splitDetails = await this.getExpenseSplits(expense.id);
      }
      
      return expenses;
    } catch (error) {
      throw new Error(`Failed to fetch user expenses: ${error.message}`);
    }
  }

  /**
   * Get expense statistics for a group
   */
  async getGroupExpenseStats(groupId) {
    try {
      await this.initialize();
      
      const statsQuery = `
        SELECT 
          COUNT(*) as expense_count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM expenses
        WHERE group_id = $1
      `;
      
      const stats = await this.db.getOne(statsQuery, [groupId]);
      
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
      
      const balances = await this.db.getMany(balancesQuery, [groupId]);
      
      // Calculate net balance for each user
      const userBalances = {};
      balances.forEach(balance => {
        userBalances[balance.user_id] = balance.paid_amount - balance.owed_amount;
      });
      
      // Get all expenses for the group
      const expenses = await this.getExpensesByGroup(groupId);
      
      return {
        totalAmount: parseFloat(stats.total_amount),
        expenseCount: parseInt(stats.expense_count),
        balances: userBalances,
        expenses: expenses
      };
    } catch (error) {
      throw new Error(`Failed to get group expense stats: ${error.message}`);
    }
  }

  /**
   * Calculate equal split for a group
   */
  async calculateEqualSplit(groupId, amount, participants) {
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
      throw new Error(`Failed to calculate equal split: ${error.message}`);
    }
  }

  /**
   * Validate expense data
   */
  validateExpenseData(expenseData) {
    const errors = [];
    
    if (expenseData.title !== undefined && (!expenseData.title || expenseData.title.trim() === '')) {
      errors.push('Title is required');
    }
    
    if (expenseData.amount !== undefined && (!expenseData.amount || isNaN(expenseData.amount) || parseFloat(expenseData.amount) <= 0)) {
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

module.exports = ExpenseServiceDB;
