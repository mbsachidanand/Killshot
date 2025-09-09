/**
 * Request ID Middleware
 * Adds unique request ID for better tracking and debugging
 */

const crypto = require('crypto');

/**
 * Generate unique request ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestIdMiddleware = (req, res, next) => {
  // Generate unique request ID
  req.id = crypto.randomUUID();
  
  // Add request ID to response headers
  res.set('X-Request-ID', req.id);
  
  // Add request ID to response body for API responses
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object') {
      data.requestId = req.id;
    }
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = requestIdMiddleware;
