/**
 * Cache Middleware
 * Simple in-memory caching for frequently accessed data
 */

import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  value: any;
  expiry: number;
}

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  memoryUsage: number;
}

type KeyGenerator = (req: Request) => string;

class CacheManager {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;

  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Set cache entry
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds
   */
  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get cache entry
   * @param key - Cache key
   * @returns Cached value or null if expired/not found
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Delete cache entry
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredEntries++;
        this.cache.delete(key);
      } else {
        validEntries++;
      }
    }
    
    return {
      totalEntries: validEntries + expiredEntries,
      validEntries,
      expiredEntries,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Cache middleware factory
 * @param keyGenerator - Function to generate cache key from request
 * @param ttl - Time to live in milliseconds
 * @returns Express middleware
 */
const cacheMiddleware = (keyGenerator: KeyGenerator, ttl: number = 5 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const cached = cacheManager.get(key);
    
    if (cached) {
      res.json(cached);
      return;
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheManager.set(key, data, ttl);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Invalidate cache entries by pattern
 * @param pattern - Pattern to match cache keys
 */
const invalidateCache = (pattern: string): void => {
  const regex = new RegExp(pattern);
  for (const key of (cacheManager as any).cache.keys()) {
    if (regex.test(key)) {
      cacheManager.delete(key);
    }
  }
};

/**
 * Cache key generators
 */
const cacheKeys = {
  groups: (req: Request): string => `groups:${req.query.page || 1}:${req.query.limit || 100}`,
  groupById: (req: Request): string => `group:${req.params.id}`,
  expenses: (req: Request): string => `expenses:${req.query.groupId || 'all'}:${req.query.page || 1}`,
  expenseById: (req: Request): string => `expense:${req.params.id}`
};

export {
  cacheManager,
  cacheMiddleware,
  invalidateCache,
  cacheKeys
};

export default {
  cacheManager,
  cacheMiddleware,
  invalidateCache,
  cacheKeys
};
