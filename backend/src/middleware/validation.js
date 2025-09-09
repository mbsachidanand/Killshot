/**
 * Validation Middleware
 * Enhanced input validation and sanitization
 */

const { validationResult } = require('express-validator');
const { body, param, query } = require('express-validator');

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  }
  
  next();
};

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Sanitize input middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  // ID validation
  id: param('id')
    .isUUID()
    .withMessage('Invalid ID format')
    .notEmpty()
    .withMessage('ID is required'),
  
  // Group name validation
  groupName: body('name')
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Group name can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim(),
  
  // Description validation
  description: body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .trim(),
  
  // Expense title validation
  expenseTitle: body('title')
    .notEmpty()
    .withMessage('Expense title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Expense title must be between 1 and 200 characters')
    .trim(),
  
  // Amount validation
  amount: body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0')
    .isNumeric()
    .withMessage('Amount must be a valid number'),
  
  // User ID validation
  userId: body('paidBy')
    .isUUID()
    .withMessage('Invalid user ID format')
    .notEmpty()
    .withMessage('User ID is required'),
  
  // Group ID validation
  groupId: body('groupId')
    .isUUID()
    .withMessage('Invalid group ID format')
    .notEmpty()
    .withMessage('Group ID is required'),
  
  // Date validation
  date: body('date')
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format')
    .optional(),
  
  // Split type validation
  splitType: body('splitType')
    .isIn(['equal', 'percentage', 'exact'])
    .withMessage('Split type must be one of: equal, percentage, exact'),
  
  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  commonValidations
};
