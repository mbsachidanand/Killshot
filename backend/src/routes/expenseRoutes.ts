/**
 * Expense Routes
 * Defines all routes for expense operations
 *
 * @fileoverview TypeScript implementation of expense routes with full type safety
 */

import { ExpenseController } from '@/controllers/ExpenseController';
import {
    createExpenseValidation,
    dateRangeValidation,
    expenseIdValidation,
    paginationValidation,
    updateExpenseValidation
} from '@/middleware/validation';
import { Router } from 'express';

/**
 * Expense Routes Router
 *
 * This router defines all the routes for expense operations including
 * CRUD operations, expense filtering, and statistics.
 */
const router: Router = Router();

// Initialize controller
const expenseController = new ExpenseController();

/**
 * @route   GET /api/v1/expenses
 * @desc    Get all expenses with optional filtering and pagination
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   groupId - Filter by group ID
 * @query   userId - Filter by user ID
 * @query   search - Search query for expense title or description
 * @query   startDate - Filter by start date (ISO 8601)
 * @query   endDate - Filter by end date (ISO 8601)
 */
router.get('/', paginationValidation, expenseController.getAllExpenses);

/**
 * @route   GET /api/v1/expenses/search
 * @desc    Search expenses by title or description
 * @access  Public
 * @query   q - Search query (required)
 */
router.get('/search', expenseController.searchExpenses);

/**
 * @route   GET /api/v1/expenses/date-range
 * @desc    Get expenses by date range
 * @access  Public
 * @query   startDate - Start date (ISO 8601, required)
 * @query   endDate - End date (ISO 8601, required)
 */
router.get('/date-range', dateRangeValidation, expenseController.getExpensesByDateRange);

/**
 * @route   GET /api/v1/expenses/group/:groupId
 * @desc    Get all expenses for a specific group
 * @access  Public
 * @param   groupId - Group ID
 */
router.get('/group/:groupId', expenseController.getExpensesByGroup);

/**
 * @route   GET /api/v1/expenses/user/:userId
 * @desc    Get all expenses for a specific user
 * @access  Public
 * @param   userId - User ID
 */
router.get('/user/:userId', expenseController.getExpensesByUser);

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get a specific expense by ID
 * @access  Public
 * @param   id - Expense ID
 */
router.get('/:id', expenseIdValidation, expenseController.getExpenseById);

/**
 * @route   POST /api/v1/expenses
 * @desc    Create a new expense
 * @access  Public
 * @body    title - Expense title (required)
 * @body    amount - Expense amount (required)
 * @body    paidBy - User ID who paid (required)
 * @body    groupId - Group ID (required)
 * @body    splitType - Split type: equal, exact, percentage (required)
 * @body    date - Expense date (ISO 8601, optional)
 * @body    description - Expense description (optional)
 * @body    splits - Split details (optional)
 */
router.post('/', createExpenseValidation, expenseController.createExpense);

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Update an expense
 * @access  Public
 * @param   id - Expense ID
 * @body    title - Expense title (optional)
 * @body    amount - Expense amount (optional)
 * @body    paidBy - User ID who paid (optional)
 * @body    splitType - Split type: equal, exact, percentage (optional)
 * @body    date - Expense date (ISO 8601, optional)
 * @body    description - Expense description (optional)
 * @body    splits - Split details (optional)
 */
router.put('/:id', expenseIdValidation, updateExpenseValidation, expenseController.updateExpense);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete an expense
 * @access  Public
 * @param   id - Expense ID
 */
router.delete('/:id', expenseIdValidation, expenseController.deleteExpense);

/**
 * @route   GET /api/v1/expenses/group/:groupId/stats
 * @desc    Get expense statistics for a group
 * @access  Public
 * @param   groupId - Group ID
 */
router.get('/group/:groupId/stats', expenseController.getGroupExpenseStats);

/**
 * @route   POST /api/v1/expenses/calculate-split
 * @desc    Calculate equal split for a group
 * @access  Public
 * @body    groupId - Group ID (required)
 * @body    amount - Total amount to split (required)
 * @body    participants - Array of participants (required)
 */
router.post('/calculate-split', expenseController.calculateEqualSplit);

export default router;
