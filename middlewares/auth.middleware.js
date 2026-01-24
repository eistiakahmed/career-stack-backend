/**
 * Authentication Middleware
 * Handles JWT verification, session management, and request authentication
 */

const { Token } = require('../utils/security');
const redis = require('../config/redis.config');
const { ErrorResponse } = require('../utils/error');
const config = require('../config/env.config');
const logger = require('../utils/logger');

/**
 * Extract token from request
 */
const extractToken = (req) => {
  // Check Authorization header first
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie (for web clients)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  // Check query parameter (for API clients)
  if (req.query.token) {
    return req.query.token;
  }

  return null;
};

/**
 * Verify access token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token
    const token = extractToken(req);

    if (!token) {
      throw new ErrorResponse('No authentication token provided', 401);
    }

    // Verify token
    const decoded = Token.verifyAccessToken(token);

    // Check if token is blacklisted (for logout functionality)
    const isBlacklisted = await redis.getCache(`blacklist:${token}`);

    if (isBlacklisted) {
      throw new ErrorResponse('Token has been revoked', 401);
    }

    // Check if session exists in Redis
    const session = await redis.cacheGet(`session:${decoded.userId}`);

    if (!session) {
      throw new ErrorResponse('Session expired or invalid', 401);
    }

    // Verify token matches current session token
    if (session.token !== token) {
      throw new ErrorResponse('Invalid session token', 401);
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      subscriptionTier: decoded.subscriptionTier,
    };

    req.session = session;

    // Log authentication
    logger.debug('User authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    next();

  } catch (error) {
    logger.error('Authentication error:', error);

    if (error instanceof ErrorResponse) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: 'AUTH_FAILED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = Token.verifyAccessToken(token);

      // Check if token is blacklisted
      const isBlacklisted = await redis.getCache(`blacklist:${token}`);

      if (!isBlacklisted) {
        const session = await redis.cacheGet(`session:${decoded.userId}`);

        if (session && session.token === token) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            subscriptionTier: decoded.subscriptionTier,
          };

          req.session = session;
        }
      }
    }

    next();

  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ErrorResponse('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = Token.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in Redis
    const storedToken = await redis.cacheGet(`refresh_token:${decoded.userId}`);

    if (!storedToken || storedToken !== refreshToken) {
      throw new ErrorResponse('Invalid refresh token', 401);
    }

    // Attach decoded data to request
    req.refreshToken = refreshToken;
    req.tokenData = decoded;

    next();

  } catch (error) {
    logger.error('Refresh token verification error:', error);

    if (error instanceof ErrorResponse) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: 'REFRESH_TOKEN_INVALID',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      code: 'REFRESH_TOKEN_INVALID',
    });
  }
};

/**
 * Check if user account is verified
 */
const requireVerifiedEmail = (req, res, next) => {
  try {
    if (!req.user) {
      throw new ErrorResponse('Authentication required', 401);
    }

    if (!req.user.isEmailVerified) {
      throw new ErrorResponse('Please verify your email address', 403);
    }

    next();

  } catch (error) {
    logger.error('Email verification check error:', error);

    if (error instanceof ErrorResponse) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Check subscription tier
 */
const requireSubscription = (minTier = 'free') => {
  const tiers = {
    free: 0,
    pro: 1,
    enterprise: 2,
  };

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      const userTier = tiers[req.user.subscriptionTier] || 0;
      const requiredTier = tiers[minTier] || 0;

      if (userTier < requiredTier) {
        throw new ErrorResponse(`This feature requires ${minTier} subscription or higher`, 403);
      }

      next();

    } catch (error) {
      logger.error('Subscription check error:', error);

      if (error instanceof ErrorResponse) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'SUBSCRIPTION_REQUIRED',
          requiredTier: minTier,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Require active subscription (not expired or cancelled)
 */
const requireActiveSubscription = (req, res, next) => {
  // This would check the database for active subscription
  // Implementation depends on your subscription model
  next();
};

/**
 * Check if user has specific permission
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      if (!req.user.permissions || !req.user.permissions.includes(permission)) {
        throw new ErrorResponse('Insufficient permissions', 403);
      }

      next();

    } catch (error) {
      logger.error('Permission check error:', error);

      if (error instanceof ErrorResponse) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'PERMISSION_DENIED',
          requiredPermission: permission,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Check multiple permissions (all must be present)
 */
const hasAllPermissions = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      const hasAll = permissions.every(permission =>
        req.user.permissions && req.user.permissions.includes(permission)
      );

      if (!hasAll) {
        throw new ErrorResponse('Insufficient permissions', 403);
      }

      next();

    } catch (error) {
      logger.error('Permission check error:', error);

      if (error instanceof ErrorResponse) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'PERMISSION_DENIED',
          requiredPermissions: permissions,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Check if user owns the resource
 */
const ownsResource = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      // Admin users can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource owner ID
      const resourceOwnerId = await getResourceOwnerId(req);

      if (req.user.userId !== resourceOwnerId) {
        throw new ErrorResponse('Access denied: You do not own this resource', 403);
      }

      next();

    } catch (error) {
      logger.error('Resource ownership check error:', error);

      if (error instanceof ErrorResponse) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'RESOURCE_ACCESS_DENIED',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Two-factor authentication check
 */
const requireTwoFactor = (req, res, next) => {
  try {
    if (!req.user) {
      throw new ErrorResponse('Authentication required', 401);
    }

    // Skip if 2FA is not enabled for user
    if (!req.user.twoFactorEnabled) {
      return next();
    }

    // Check if 2FA has been verified in session
    if (!req.session.twoFactorVerified) {
      throw new ErrorResponse('Two-factor authentication required', 403);
    }

    next();

  } catch (error) {
    logger.error('2FA check error:', error);

    if (error instanceof ErrorResponse) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: 'TWO_FACTOR_REQUIRED',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  verifyRefreshToken,
  requireVerifiedEmail,
  requireSubscription,
  requireActiveSubscription,
  hasPermission,
  hasAllPermissions,
  ownsResource,
  requireTwoFactor,
};
