/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse using Redis-based rate limiting
 */

const redis = require('../config/redis.config');
const { ErrorResponse } = require('../utils/error');
const config = require('../config/env.config');
const logger = require('../utils/logger');

/**
 * Rate limit configuration for different endpoint types
 */
const RateLimitConfigs = {
  // General API rate limit
  general: {
    windowMs: config.rateLimit.windowMs, // 15 minutes
    maxRequests: config.rateLimit.maxRequests, // 100 requests
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: config.rateLimit.authMax, // 5 requests
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // AI features (moderate)
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: config.rateLimit.aiMax, // 20 requests
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },

  // File uploads
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // PDF export
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Email verification
  emailVerification: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 5,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Public portfolio view (lenient)
  publicView: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  },
};

/**
 * Generate rate limit key
 */
const getRateLimitKey = (identifier, type) => {
  return `rate_limit:${type}:${identifier}`;
};

/**
 * Get client identifier (IP address or user ID)
 */
const getClientIdentifier = (req) => {
  // Use user ID if authenticated
  if (req.user && req.user.userId) {
    return `user:${req.user.userId}`;
  }

  // Use IP address
  const ip = req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    'unknown';

  return `ip:${ip}`;
};

/**
 * Rate limiter factory
 */
const createRateLimiter = (type, customOptions = {}) => {
  const options = {
    ...RateLimitConfigs.general,
    ...customOptions,
  };

  return async (req, res, next) => {
    try {
      const identifier = getClientIdentifier(req);
      const key = getRateLimitKey(identifier, type);
      const currentTime = Date.now();
      const windowStart = currentTime - options.windowMs;

      // Get current rate limit data from Redis
      const rateLimitData = await redis.cacheGet(key);

      if (!rateLimitData) {
        // First request in window
        const newData = {
          count: 1,
          resetTime: currentTime + options.windowMs,
          requests: [currentTime],
        };

        await redis.cacheSet(key, newData, Math.ceil(options.windowMs / 1000));

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', options.maxRequests);
        res.setHeader('X-RateLimit-Remaining', options.maxRequests - 1);
        res.setHeader('X-RateLimit-Reset', new Date(newData.resetTime).toISOString());

        req.rateLimit = {
          limit: options.maxRequests,
          remaining: options.maxRequests - 1,
          reset: new Date(newData.resetTime),
        };

        return next();
      }

      // Clean old requests outside the window
      rateLimitData.requests = rateLimitData.requests.filter(
        time => time > windowStart
      );

      // Skip counting based on configuration
      const skipCount =
        (options.skipSuccessfulRequests && res.statusCode < 400) ||
        (options.skipFailedRequests && res.statusCode >= 400);

      if (!skipCount) {
        rateLimitData.requests.push(currentTime);
      }

      const currentCount = rateLimitData.requests.length;

      // Check if limit exceeded
      if (currentCount > options.maxRequests) {
        const retryAfter = Math.ceil((rateLimitData.resetTime - currentTime) / 1000);

        logger.warn('Rate limit exceeded', {
          identifier,
          type,
          currentCount,
          limit: options.maxRequests,
          ip: req.ip,
          path: req.path,
        });

        return res.status(429).json({
          success: false,
          message: `Too many requests. Please try again later.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
          limit: options.maxRequests,
        });
      }

      // Update rate limit data
      await redis.cacheSet(key, rateLimitData, Math.ceil(options.windowMs / 1000));

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - currentCount));
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitData.resetTime).toISOString());

      req.rateLimit = {
        limit: options.maxRequests,
        remaining: Math.max(0, options.maxRequests - currentCount),
        reset: new Date(rateLimitData.resetTime),
      };

      next();

    } catch (error) {
      logger.error('Rate limiter error:', error);

      // Fail open - don't block requests if Redis is down
      next();
    }
  };
};

/**
 * Pre-configured rate limiters
 */
const rateLimit = {
  // General rate limiter
  general: createRateLimiter('general'),

  // Authentication endpoints
  auth: createRateLimiter('auth', RateLimitConfigs.auth),

  // Login-specific
  login: createRateLimiter('login', {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  // Registration
  register: createRateLimiter('register', {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  }),

  // Password reset
  passwordReset: createRateLimiter('passwordReset', RateLimitConfigs.passwordReset),

  // Email verification
  emailVerification: createRateLimiter('emailVerification', RateLimitConfigs.emailVerification),

  // AI features
  ai: createRateLimiter('ai', RateLimitConfigs.ai),

  // File uploads
  upload: createRateLimiter('upload', RateLimitConfigs.upload),

  // PDF export
  export: createRateLimiter('export', RateLimitConfigs.export),

  // Public portfolio view
  publicView: createRateLimiter('publicView', RateLimitConfigs.publicView),

  // Search
  search: createRateLimiter('search', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  }),

  // API key usage
  apiKey: createRateLimiter('apiKey', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),
};

/**
 * Smart rate limiter - adjusts based on user tier
 */
const smartRateLimit = (type, baseLimit) => {
  return async (req, res, next) => {
    try {
      let maxRequests = baseLimit;

      // Adjust limit based on subscription tier
      if (req.user) {
        const tier = req.user.subscriptionTier || 'free';

        switch (tier) {
          case 'pro':
            maxRequests = Math.floor(baseLimit * 3);
            break;
          case 'enterprise':
            maxRequests = baseLimit * 10; // Essentially unlimited
            break;
          default:
            maxRequests = baseLimit;
        }
      }

      // Use the dynamic rate limiter
      const limiter = createRateLimiter(type, {
        windowMs: 60 * 1000, // 1 minute
        maxRequests,
      });

      return limiter(req, res, next);

    } catch (error) {
      logger.error('Smart rate limiter error:', error);
      next();
    }
  };
};

/**
 * Clear rate limit for a user (admin function)
 */
const clearRateLimit = async (identifier, type) => {
  try {
    const key = getRateLimitKey(identifier, type);
    await redis.cacheDelete(key);
    return true;
  } catch (error) {
    logger.error('Error clearing rate limit:', error);
    return false;
  }
};

/**
 * Get rate limit status for a user
 */
const getRateLimitStatus = async (identifier, type) => {
  try {
    const key = getRateLimitKey(identifier, type);
    const data = await redis.cacheGet(key);

    if (!data) {
      return {
        count: 0,
        limit: RateLimitConfigs[type]?.maxRequests || RateLimitConfigs.general.maxRequests,
        remaining: RateLimitConfigs[type]?.maxRequests || RateLimitConfigs.general.maxRequests,
        resetAt: null,
      };
    }

    return {
      count: data.requests.length,
      limit: RateLimitConfigs[type]?.maxRequests || RateLimitConfigs.general.maxRequests,
      remaining: Math.max(0, (RateLimitConfigs[type]?.maxRequests || RateLimitConfigs.general.maxRequests) - data.requests.length),
      resetAt: new Date(data.resetTime),
    };
  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    return null;
  }
};

module.exports = {
  rateLimit,
  createRateLimiter,
  smartRateLimit,
  clearRateLimit,
  getRateLimitStatus,
  RateLimitConfigs,
};
