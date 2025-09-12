/**
 * Validation Middleware
 * Input validation middleware using express-validator
 *
 * @fileoverview TypeScript implementation of validation middleware
 */

import { NextFunction, Request, Response } from 'express';
import { ValidationChain, body, param, query, validationResult } from 'express-validator';
import { createValidationError } from './errorHandler';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Handle validation results
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors: ValidationError[] = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    throw createValidationError(validationErrors);
  }

  next();
};

/**
 * Validate request body
 *
 * @param validations - Array of validation chains
 * @returns {Function} Middleware function
 */
export const validateBody = (validations: ValidationChain[]) => {
  return [
    ...validations,
    handleValidationErrors
  ];
};

/**
 * Validate request parameters
 *
 * @param validations - Array of validation chains
 * @returns {Function} Middleware function
 */
export const validateParams = (validations: ValidationChain[]) => {
  return [
    ...validations,
    handleValidationErrors
  ];
};

/**
 * Validate query parameters
 *
 * @param validations - Array of validation chains
 * @returns {Function} Middleware function
 */
export const validateQuery = (validations: ValidationChain[]) => {
  return [
    ...validations,
    handleValidationErrors
  ];
};

// ============================================================================
// Group Validation Rules
// ============================================================================

/**
 * Create group validation rules
 */
export const createGroupValidation = validateBody([
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Group name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('memberEmails')
    .optional()
    .isArray()
    .withMessage('Member emails must be an array')
    .custom((emails: string[]) => {
      if (emails.length > 50) {
        throw new Error('Cannot add more than 50 members at once');
      }
      return true;
    }),

  body('memberEmails.*')
    .optional()
    .isEmail()
    .withMessage('Each member email must be a valid email address')
    .normalizeEmail()
]);

/**
 * Update group validation rules
 */
export const updateGroupValidation = validateBody([
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Group name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
]);

/**
 * Group ID parameter validation
 */
export const groupIdValidation = validateParams([
  param('id')
    .isUUID()
    .withMessage('Group ID must be a valid UUID')
]);

// ============================================================================
// Expense Validation Rules
// ============================================================================

/**
 * Create expense validation rules
 */
export const createExpenseValidation = validateBody([
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Expense title must be between 1 and 200 characters'),

  body('amount')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Expense amount must be between 0.01 and 999999.99'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  body('paidBy')
    .isUUID()
    .withMessage('Paid by must be a valid user ID'),

  body('splitType')
    .isIn(['equal', 'exact', 'percentage'])
    .withMessage('Split type must be equal, exact, or percentage'),

  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
    .custom((date: string) => {
      const expenseDate = new Date(date);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      if (expenseDate > now) {
        throw new Error('Expense date cannot be in the future');
      }

      if (expenseDate < oneYearAgo) {
        throw new Error('Expense date cannot be more than one year ago');
      }

      return true;
    }),

  body('splits')
    .optional()
    .isArray()
    .withMessage('Splits must be an array')
    .custom((splits: any[]) => {
      if (splits.length > 50) {
        throw new Error('Cannot have more than 50 splits');
      }
      return true;
    }),

  body('splits.*.userId')
    .optional()
    .isUUID()
    .withMessage('Each split must have a valid user ID'),

  body('splits.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Split amount must be a positive number'),

  body('splits.*.percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Split percentage must be between 0 and 100')
]);

/**
 * Update expense validation rules
 */
export const updateExpenseValidation = validateBody([
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Expense title must be between 1 and 200 characters'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Expense amount must be between 0.01 and 999999.99'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  body('paidBy')
    .optional()
    .isUUID()
    .withMessage('Paid by must be a valid user ID'),

  body('splitType')
    .optional()
    .isIn(['equal', 'exact', 'percentage'])
    .withMessage('Split type must be equal, exact, or percentage'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
    .custom((date: string) => {
      const expenseDate = new Date(date);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      if (expenseDate > now) {
        throw new Error('Expense date cannot be in the future');
      }

      if (expenseDate < oneYearAgo) {
        throw new Error('Expense date cannot be more than one year ago');
      }

      return true;
    })
]);

/**
 * Expense ID parameter validation
 */
export const expenseIdValidation = validateParams([
  param('id')
    .isUUID()
    .withMessage('Expense ID must be a valid UUID')
]);

// ============================================================================
// Query Parameter Validation
// ============================================================================

/**
 * Pagination validation rules
 */
export const paginationValidation = validateQuery([
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
]);

/**
 * Search validation rules
 */
export const searchValidation = validateQuery([
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Search term can only contain letters, numbers, spaces, hyphens, and underscores')
]);

/**
 * Date range validation rules
 */
export const dateRangeValidation = validateQuery([
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate: string, { req }) => {
      const startDate = req.query.startDate as string;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
]);

/**
 * Validate member data for group operations
 */
export const validateMemberData = validateBody([
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Member name is required').trim()
]);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sanitize input string
 *
 * @param input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 1000); // Limit length
};

/**
 * Validate email format
 *
 * @param email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UUID format
 *
 * @param uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export default {
  handleValidationErrors,
  validateBody,
  validateParams,
  validateQuery,
  createGroupValidation,
  updateGroupValidation,
  groupIdValidation,
  createExpenseValidation,
  updateExpenseValidation,
  expenseIdValidation,
  paginationValidation,
  searchValidation,
  dateRangeValidation,
  sanitizeInput,
  isValidEmail,
  isValidUUID
};
