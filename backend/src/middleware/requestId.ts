/**
 * Request ID Middleware
 * Adds unique request ID to each request for tracking
 *
 * @fileoverview TypeScript implementation of request ID middleware
 */

import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request interface with ID property
 */
export interface RequestWithId extends Request {
  id: string;
}

/**
 * Request ID middleware
 * Adds a unique request ID to each request for tracking and debugging
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestIdMiddleware = (
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void => {
  // Generate or use existing request ID
  req.id = req.get('X-Request-ID') || uuidv4();

  // Add request ID to response headers
  res.set('X-Request-ID', req.id);

  // Add request ID to response locals for logging
  res.locals.requestId = req.id;

  next();
};

/**
 * Generate request ID
 *
 * @returns {string} Unique request ID
 */
export const generateRequestId = (): string => {
  return uuidv4();
};

/**
 * Validate request ID format
 *
 * @param id - Request ID to validate
 * @returns {boolean} True if valid UUID format
 */
export const isValidRequestId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export default requestIdMiddleware;
