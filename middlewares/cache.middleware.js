/**
 * Cache Middleware
 * Response caching middleware using Redis
 */

const redis = require('../config/redis.config');
const { CACHE_KEYS, TIME } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
  const userId = req.user?.userId || 'anonymous';
  const url = req.originalUrl;
  const method = req.method;

  return `${method}:${userId}:${url}`;
};

/**
 * Cache response middleware
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 */
const cacheResponse = (ttl = 3600) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if user has no-cache header
    if (req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const key = generateCacheKey(req);

    try {
      // Try to get cached response
      const cached = await redis.cacheGet(key);

      if (cached) {
        logger.debug('Cache hit', { key });
        return res.json(cached);
      }

      logger.debug('Cache miss', { key });

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = (data) => {
        // Cache successful responses only
        if (res.statusCode === 200) {
          redis.cacheSet(key, data, ttl).catch((err) => {
            logger.error('Cache set error:', err);
          });
        }

        return originalJson(data);
      };

      next();

    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear cache for specific pattern
 */
const clearCache = (pattern) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to clear cache after response
    res.json = (data) => {
      // Clear cache if response is successful
      if (res.statusCode < 300) {
        redis.cacheDeletePattern(pattern).catch((err) => {
          logger.error('Cache clear error:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Prevent response from being cached
 */
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

/**
 * Cache user data
 */
const cacheUser = (req, res, next) => {
  if (!req.user?.userId) {
    return next();
  }

  const key = CACHE_KEYS.USER(req.user.userId);

  // Check cache
  redis.cacheGet(key)
    .then((cached) => {
      if (cached) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        if (res.statusCode === 200) {
          redis.cacheSet(key, data, TIME.ONE_HOUR / 1000);
        }
        return originalJson(data);
      };

      next();
    })
    .catch((error) => {
      logger.error('User cache error:', error);
      next();
    });
};

/**
 * Cache resume data
 */
const cacheResume = (req, res, next) => {
  const resumeId = req.params.resumeId;

  if (!resumeId) {
    return next();
  }

  const key = CACHE_KEYS.RESUME(resumeId);

  // Check cache
  redis.cacheGet(key)
    .then((cached) => {
      if (cached) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        if (res.statusCode === 200) {
          redis.cacheSet(key, data, TIME.ONE_HOUR / 1000);
        }
        return originalJson(data);
      };

      next();
    })
    .catch((error) => {
      logger.error('Resume cache error:', error);
      next();
    });
};

/**
 * Invalidate cache for user
 */
const invalidateUserCache = (userId) => {
  return redis.cacheDeletePattern(`user:${userId}*`);
};

/**
 * Invalidate cache for resume
 */
const invalidateResumeCache = (resumeId) => {
  return redis.cacheDeletePattern(`resume:${resumeId}*`);
};

module.exports = {
  cacheResponse,
  clearCache,
  noCache,
  cacheUser,
  cacheResume,
  invalidateUserCache,
  invalidateResumeCache,
  generateCacheKey,
};
