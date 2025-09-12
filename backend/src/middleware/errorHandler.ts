/**
 * Error Handler Middleware
 * Centralized error handling for the application
 *
 * @fileoverview TypeScript implementation of error handling middleware
 */

import { ErrorResponse, ValidationError } from '@/types';
import { NextFunction, Request, Response } from 'express';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: ValidationError[];

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: ValidationError[]
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details || [];

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationErrorClass extends Error {
  public field: string;
  public value?: any;

  constructor(field: string, message: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Database error class
 */
export class DatabaseError extends Error {
  public query?: string;
  public params?: any[];

  constructor(message: string, query?: string, params?: any[]) {
    super(message);
    this.name = 'DatabaseError';
    this.query = query || '';
    this.params = params || [];
  }
}

/**
 * Global error handler middleware
 *
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Enhanced logging with request context
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: (req as any).id
  });

  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: ValidationError[] | undefined;

  // Handle different error types
  if (err instanceof APIError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ValidationErrorClass) {
    statusCode = 400;
    message = err.message;
    details = [{
      field: (err as any).field,
      message: err.message,
      value: (err as any).value
    }];
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
    message = 'Database operation failed';
    console.error('Database Error:', {
      query: err.query,
      params: err.params,
      originalError: err.message
    });
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
    statusCode = 500;
    message = 'Database error';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString(),
    requestId: (req as any).id
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse as any).stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new APIError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 *
 * @param fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 *
 * @param errors - Array of validation errors
 * @returns {APIError} API error with validation details
 */
export const createValidationError = (errors: ValidationError[]): APIError => {
  return new APIError('Validation failed', 400, true, errors);
};

/**
 * Database error handler
 *
 * @param error - Original database error
 * @param query - SQL query that failed
 * @param params - Query parameters
 * @returns {DatabaseError} Database error
 */
export const createDatabaseError = (
  error: Error,
  query?: string,
  params?: any[]
): DatabaseError => {
  return new DatabaseError(error.message, query, params);
};

/**
 * Not found error handler
 *
 * @param resource - Resource that was not found
 * @returns {APIError} Not found error
 */
export const createNotFoundError = (resource: string): APIError => {
  return new APIError(`${resource} not found`, 404);
};

/**
 * Unauthorized error handler
 *
 * @param message - Error message
 * @returns {APIError} Unauthorized error
 */
export const createUnauthorizedError = (message: string = 'Unauthorized'): APIError => {
  return new APIError(message, 401);
};

/**
 * Forbidden error handler
 *
 * @param message - Error message
 * @returns {APIError} Forbidden error
 */
export const createForbiddenError = (message: string = 'Forbidden'): APIError => {
  return new APIError(message, 403);
};

/**
 * Conflict error handler
 *
 * @param message - Error message
 * @returns {APIError} Conflict error
 */
export const createConflictError = (message: string = 'Conflict'): APIError => {
  return new APIError(message, 409);
};

/**
 * Rate limit error handler
 *
 * @param message - Error message
 * @returns {APIError} Rate limit error
 */
export const createRateLimitError = (message: string = 'Too many requests'): APIError => {
  return new APIError(message, 429);
};

export default errorHandler;
