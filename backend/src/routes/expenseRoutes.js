/**
 * Expense Routes
 * Defines API endpoints for expense operations
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const ExpenseController = require('../controllers/ExpenseController');

const router = express.Router();
const expenseController = new ExpenseController();

// Validation middleware
const validateExpenseCreation = [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),
    
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number greater than 0'),
    
    body('paidBy')
        .notEmpty()
        .withMessage('Paid by user ID is required'),
    
    body('groupId')
        .notEmpty()
        .withMessage('Group ID is required'),
    
    body('splitType')
        .optional()
        .isIn(['equal', 'exact', 'percentage'])
        .withMessage('Split type must be equal, exact, or percentage'),
    
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid ISO 8601 date'),
    
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters')
];

const validateExpenseUpdate = [
    body('title')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),
    
    body('amount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number greater than 0'),
    
    body('paidBy')
        .optional()
        .notEmpty()
        .withMessage('Paid by user ID cannot be empty'),
    
    body('groupId')
        .optional()
        .notEmpty()
        .withMessage('Group ID cannot be empty'),
    
    body('splitType')
        .optional()
        .isIn(['equal', 'exact', 'percentage'])
        .withMessage('Split type must be equal, exact, or percentage'),
    
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid ISO 8601 date'),
    
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters')
];

const validateSplitCalculation = [
    body('groupId')
        .notEmpty()
        .withMessage('Group ID is required'),
    
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number greater than 0'),
    
    body('splitType')
        .optional()
        .isIn(['equal', 'exact', 'percentage'])
        .withMessage('Split type must be equal, exact, or percentage')
];

const validateIdParam = [
    param('id')
        .notEmpty()
        .withMessage('ID parameter is required')
];

const validateGroupIdParam = [
    param('groupId')
        .notEmpty()
        .withMessage('Group ID parameter is required')
];

const validateUserIdParam = [
    param('userId')
        .notEmpty()
        .withMessage('User ID parameter is required')
];

// Routes

/**
 * @route   POST /api/v1/expenses
 * @desc    Create a new expense
 * @access  Public
 */
router.post('/', validateExpenseCreation, expenseController.createExpense);

/**
 * @route   GET /api/v1/expenses
 * @desc    Get all expenses
 * @access  Public
 */
router.get('/', expenseController.getAllExpenses);

/**
 * @route   GET /api/v1/expenses/group/:groupId
 * @desc    Get expenses by group ID
 * @access  Public
 */
router.get('/group/:groupId', validateGroupIdParam, expenseController.getExpensesByGroup);

/**
 * @route   GET /api/v1/expenses/group/:groupId/stats
 * @desc    Get expense statistics for a group
 * @access  Public
 */
router.get('/group/:groupId/stats', validateGroupIdParam, expenseController.getGroupExpenseStats);

/**
 * @route   GET /api/v1/expenses/user/:userId
 * @desc    Get expenses by user ID
 * @access  Public
 */
router.get('/user/:userId', validateUserIdParam, expenseController.getExpensesByUser);

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get expense by ID
 * @access  Public
 */
router.get('/:id', validateIdParam, expenseController.getExpenseById);

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Update an expense
 * @access  Public
 */
router.put('/:id', validateIdParam, validateExpenseUpdate, expenseController.updateExpense);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete an expense
 * @access  Public
 */
router.delete('/:id', validateIdParam, expenseController.deleteExpense);

/**
 * @route   POST /api/v1/expenses/calculate-split
 * @desc    Calculate split for an expense
 * @access  Public
 */
router.post('/calculate-split', validateSplitCalculation, expenseController.calculateSplit);

module.exports = router;
