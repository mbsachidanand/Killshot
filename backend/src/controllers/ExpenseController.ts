/**
 * Expense Controller
 * Handles HTTP requests for expense operations
 *
 * @fileoverview TypeScript implementation of the Expense controller with full type safety
 */

import { NextFunction, Request, Response } from 'express';
import { asyncHandler, createNotFoundError, createValidationError } from '../middleware/errorHandler';
import { ExpenseService } from '../services/ExpenseService';
import {
    ApiResponse,
    CreateExpenseRequest,
    Expense,
    ExpenseResponse,
    ExpensesResponse,
    PaginationParams,
    UpdateExpenseRequest
} from '../types';

/**
 * Expense Controller Class
 *
 * This class handles all HTTP requests related to expense operations.
 * It provides methods for CRUD operations and expense management.
 */
export class ExpenseController {
  private expenseService: ExpenseService;

  constructor() {
    try {
      this.expenseService = new ExpenseService();
      console.log('ExpenseController initialized successfully');
    } catch (error) {
      console.error('Error initializing ExpenseController:', error);
      throw error;
    }
  }

  /**
   * Get all expenses
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getAllExpenses = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, groupId, userId, search, startDate, endDate } = req.query;
      const pagination: PaginationParams = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10
      };

      // Ensure pagination values are defined
      const safePage = pagination.page || 1;
      const safeLimit = pagination.limit || 10;

      let expenses: Expense[];

      // Filter by group ID
      if (groupId) {
        expenses = await this.expenseService.getExpensesByGroup(groupId as string);
      }
      // Filter by user ID
      else if (userId) {
        expenses = await this.expenseService.getExpensesByUser(userId as string);
      }
      // Search expenses
      else if (search) {
        expenses = await this.expenseService.searchExpenses(search as string);
      }
      // Filter by date range
      else if (startDate && endDate) {
        expenses = await this.expenseService.getExpensesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      }
      // Get all expenses
      else {
        expenses = await this.expenseService.findAll();
      }

      // Ensure expenses is an array
      if (!Array.isArray(expenses)) {
        console.error('Expenses is not an array:', typeof expenses, expenses);
        expenses = [];
      }

      // Simple pagination
      const startIndex = (safePage - 1) * safeLimit;
      const endIndex = startIndex + safeLimit;
      const paginatedExpenses = expenses.slice(startIndex, endIndex);

      const response: ExpensesResponse = {
        success: true,
        data: paginatedExpenses,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: expenses.length,
          totalPages: Math.ceil(expenses.length / safeLimit),
          hasNext: endIndex < expenses.length,
          hasPrev: safePage > 1
        },
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get a specific expense by ID
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getExpenseById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Expense ID is required',
          value: id
        }]);
      }

      const expense = await this.expenseService.getExpenseById(id);

      const response: ExpenseResponse = {
        success: true,
        data: expense,
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Expense');
      }
      next(error);
    }
  });

  /**
   * Create a new expense
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public createExpense = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expenseData: CreateExpenseRequest = req.body;

      // Validate required fields
      if (!expenseData.title || expenseData.title.trim() === '') {
        throw createValidationError([{
          field: 'title',
          message: 'Expense title is required',
          value: expenseData.title
        }]);
      }

      if (!expenseData.amount || expenseData.amount <= 0) {
        throw createValidationError([{
          field: 'amount',
          message: 'Expense amount must be a positive number',
          value: expenseData.amount
        }]);
      }

      if (!expenseData.paidBy || expenseData.paidBy.trim() === '') {
        throw createValidationError([{
          field: 'paidBy',
          message: 'Paid by user ID is required',
          value: expenseData.paidBy
        }]);
      }

      if (!expenseData.groupId || expenseData.groupId.trim() === '') {
        throw createValidationError([{
          field: 'groupId',
          message: 'Group ID is required',
          value: expenseData.groupId
        }]);
      }

      const expense = await this.expenseService.createExpense(expenseData);

      const response: ExpenseResponse = {
        success: true,
        data: expense,
        message: 'Expense created successfully',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Update an expense
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public updateExpense = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateExpenseRequest = req.body;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Expense ID is required',
          value: id
        }]);
      }

      // Validate update data
      if (updateData.title !== undefined && (!updateData.title || updateData.title.trim() === '')) {
        throw createValidationError([{
          field: 'title',
          message: 'Expense title cannot be empty',
          value: updateData.title
        }]);
      }

      if (updateData.amount !== undefined && updateData.amount <= 0) {
        throw createValidationError([{
          field: 'amount',
          message: 'Expense amount must be a positive number',
          value: updateData.amount
        }]);
      }

      const expense = await this.expenseService.updateExpense(id, updateData);

      const response: ExpenseResponse = {
        success: true,
        data: expense,
        message: 'Expense updated successfully',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Expense');
      }
      next(error);
    }
  });

  /**
   * Delete an expense
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public deleteExpense = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Expense ID is required',
          value: id
        }]);
      }

      await this.expenseService.deleteExpense(id);

      const response: ApiResponse = {
        success: true,
        message: 'Expense deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Expense');
      }
      next(error);
    }
  });

  /**
   * Get expenses by group ID
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getExpensesByGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupId } = req.params;

      if (!groupId) {
        throw createValidationError([{
          field: 'groupId',
          message: 'Group ID is required',
          value: groupId
        }]);
      }

      const expenses = await this.expenseService.getExpensesByGroup(groupId);

      const response: ExpensesResponse = {
        success: true,
        data: expenses,
        pagination: {
          page: 1,
          limit: expenses.length,
          total: expenses.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get expenses by user ID
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getExpensesByUser = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw createValidationError([{
          field: 'userId',
          message: 'User ID is required',
          value: userId
        }]);
      }

      const expenses = await this.expenseService.getExpensesByUser(userId);

      const response: ExpensesResponse = {
        success: true,
        data: expenses,
        pagination: {
          page: 1,
          limit: expenses.length,
          total: expenses.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get group expense statistics
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getGroupExpenseStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupId } = req.params;

      if (!groupId) {
        throw createValidationError([{
          field: 'groupId',
          message: 'Group ID is required',
          value: groupId
        }]);
      }

      const stats = await this.expenseService.getGroupExpenseStats(groupId);

      const response: ApiResponse = {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Calculate equal split for a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public calculateEqualSplit = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupId } = req.params;
      const { amount, participants } = req.body;

      if (!groupId) {
        throw createValidationError([{
          field: 'groupId',
          message: 'Group ID is required',
          value: groupId
        }]);
      }

      if (!amount || amount <= 0) {
        throw createValidationError([{
          field: 'amount',
          message: 'Amount must be a positive number',
          value: amount
        }]);
      }

      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        throw createValidationError([{
          field: 'participants',
          message: 'Participants array is required and must not be empty',
          value: participants
        }]);
      }

      const splitCalculation = await this.expenseService.calculateEqualSplit(
        groupId,
        amount,
        participants
      );

      const response: ApiResponse = {
        success: true,
        data: splitCalculation,
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Search expenses
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public searchExpenses = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;

      if (!q || (q as string).trim() === '') {
        throw createValidationError([{
          field: 'q',
          message: 'Search query is required',
          value: q
        }]);
      }

      const expenses = await this.expenseService.searchExpenses(q as string);

      const response: ExpensesResponse = {
        success: true,
        data: expenses,
        pagination: {
          page: 1,
          limit: expenses.length,
          total: expenses.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get expenses by date range
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getExpensesByDateRange = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw createValidationError([{
          field: 'startDate',
          message: 'Start date and end date are required',
          value: { startDate, endDate }
        }]);
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw createValidationError([{
          field: 'startDate',
          message: 'Invalid date format',
          value: { startDate, endDate }
        }]);
      }

      if (start > end) {
        throw createValidationError([{
          field: 'startDate',
          message: 'Start date must be before end date',
          value: { startDate, endDate }
        }]);
      }

      const expenses = await this.expenseService.getExpensesByDateRange(start, end);

      const response: ExpensesResponse = {
        success: true,
        data: expenses,
        pagination: {
          page: 1,
          limit: expenses.length,
          total: expenses.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });
}

export default ExpenseController;
