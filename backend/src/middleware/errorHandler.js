/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Enhanced logging with request context
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      success: false,
      message: 'Validation Error',
      error: message
    };
    return res.status(400).json(error);
  }

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    const message = 'Duplicate field value entered';
    error = {
      success: false,
      message: 'Duplicate Error',
      error: message,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
    return res.status(400).json(error);
  }

  // PostgreSQL foreign key constraint error
  if (err.code === '23503') {
    const message = 'Referenced record not found';
    error = {
      success: false,
      message: 'Reference Error',
      error: message,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
    return res.status(400).json(error);
  }

  // PostgreSQL not null constraint error
  if (err.code === '23502') {
    const message = 'Required field is missing';
    error = {
      success: false,
      message: 'Validation Error',
      error: message,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
    return res.status(400).json(error);
  }

  // PostgreSQL check constraint error
  if (err.code === '23514') {
    const message = 'Data validation failed';
    error = {
      success: false,
      message: 'Validation Error',
      error: message,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
    return res.status(400).json(error);
  }

  // Cast error (invalid ID format)
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = {
      success: false,
      message: 'Invalid Input',
      error: message,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      success: false,
      message: 'Authentication Error',
      error: message
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      success: false,
      message: 'Authentication Error',
      error: message
    };
    return res.status(401).json(error);
  }

  // Default to 500 server error
  res.status(err.statusCode || 500).json(error);
};

/**
 * 404 handler for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
