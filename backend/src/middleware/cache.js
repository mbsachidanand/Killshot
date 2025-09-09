/**
 * Cache Middleware
 * Simple in-memory caching for frequently accessed data
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get cache entry
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/not found
   */
  get(key) {
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
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
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
 * @param {string} keyGenerator - Function to generate cache key from request
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Function} - Express middleware
 */
const cacheMiddleware = (keyGenerator, ttl = 5 * 60 * 1000) => {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const cached = cacheManager.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
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
 * @param {string} pattern - Pattern to match cache keys
 */
const invalidateCache = (pattern) => {
  const regex = new RegExp(pattern);
  for (const key of cacheManager.cache.keys()) {
    if (regex.test(key)) {
      cacheManager.delete(key);
    }
  }
};

/**
 * Cache key generators
 */
const cacheKeys = {
  groups: (req) => `groups:${req.query.page || 1}:${req.query.limit || 100}`,
  groupById: (req) => `group:${req.params.id}`,
  expenses: (req) => `expenses:${req.query.groupId || 'all'}:${req.query.page || 1}`,
  expenseById: (req) => `expense:${req.params.id}`
};

module.exports = {
  cacheManager,
  cacheMiddleware,
  invalidateCache,
  cacheKeys
};
