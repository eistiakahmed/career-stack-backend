/**
 * Role-Based Access Control (RBAC) Middleware
 * Handles authorization based on user roles and permissions
 */

const { ErrorResponse } = require('../utils/error');
const logger = require('../utils/logger');
const config = require('../config/env.config');

/**
 * Role definitions with hierarchy
 * Higher number = higher privileges
 */
const Roles = {
  GUEST: 0,
  USER: 1,
  PREMIUM: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Permission definitions
 */
const Permissions = {
  // User permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',

  // Resume permissions
  RESUME_CREATE: 'resume:create',
  RESUME_READ: 'resume:read',
  RESUME_UPDATE: 'resume:update',
  RESUME_DELETE: 'resume:delete',
  RESUME_EXPORT: 'resume:export',
  RESUME_SHARE: 'resume:share',

  // AI features permissions
  AI_OPTIMIZE: 'ai:optimize',
  AI_GENERATE: 'ai:generate',
  AI_ANALYZE: 'ai:analyze',

  // Template permissions
  TEMPLATE_READ: 'template:read',
  TEMPLATE_CREATE: 'template:create',
  TEMPLATE_UPDATE: 'template:update',
  TEMPLATE_DELETE: 'template:delete',

  // Portfolio permissions
  PORTFOLIO_CREATE: 'portfolio:create',
  PORTFOLIO_READ: 'portfolio:read',
  PORTFOLIO_UPDATE: 'portfolio:update',
  PORTFOLIO_DELETE: 'portfolio:delete',
  PORTFOLIO_PUBLIC: 'portfolio:public',

  // Subscription permissions
  SUBSCRIPTION_MANAGE: 'subscription:manage',
  SUBSCRIPTION_UPGRADE: 'subscription:upgrade',
  SUBSCRIPTION_CANCEL: 'subscription:cancel',

  // Analytics permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',

  // Admin permissions
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_USERS: 'admin:users',
  ADMIN_CONTENT: 'admin:content',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_ANALYTICS: 'admin:analytics',
};

/**
 * Role permissions mapping
 */
// Define USER permissions first for inheritance
const userPermissions = [
  Permissions.USER_READ,
  Permissions.USER_UPDATE,
  Permissions.RESUME_CREATE,
  Permissions.RESUME_READ,
  Permissions.RESUME_UPDATE,
  Permissions.RESUME_DELETE,
  Permissions.RESUME_EXPORT,
  Permissions.RESUME_SHARE,
  Permissions.TEMPLATE_READ,
  Permissions.PORTFOLIO_CREATE,
  Permissions.PORTFOLIO_READ,
  Permissions.PORTFOLIO_UPDATE,
  Permissions.PORTFOLIO_DELETE,
  Permissions.ANALYTICS_VIEW,
  Permissions.SUBSCRIPTION_MANAGE,
  Permissions.SUBSCRIPTION_UPGRADE,
];

const RolePermissions = {
  [Roles.GUEST]: [
    Permissions.TEMPLATE_READ,
    Permissions.RESUME_READ,
  ],

  [Roles.USER]: userPermissions,

  [Roles.PREMIUM]: [
    // Inherits all USER permissions
    ...userPermissions,
    // Additional premium permissions
    Permissions.AI_OPTIMIZE,
    Permissions.AI_GENERATE,
    Permissions.AI_ANALYZE,
    Permissions.PORTFOLIO_PUBLIC,
    Permissions.ANALYTICS_EXPORT,
  ],

  [Roles.ADMIN]: [
    // All permissions
    ...Object.values(Permissions),
  ],

  [Roles.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(Permissions),
  ],
};

/**
 * Feature availability by subscription tier
 */
const FeatureLimits = {
  free: {
    maxResumes: config.limits.freePlan.resumes,
    aiCredits: config.limits.freePlan.aiCredits,
    templates: 'basic',
    exportQuality: 'standard',
    support: 'community',
    portfolio: false,
  },

  pro: {
    maxResumes: config.limits.proPlan.resumes,
    aiCredits: config.limits.proPlan.aiCredits,
    templates: 'all',
    exportQuality: 'high',
    support: 'priority',
    portfolio: true,
  },

  enterprise: {
    maxResumes: -1, // Unlimited
    aiCredits: -1, // Unlimited
    templates: 'all',
    exportQuality: 'high',
    support: 'dedicated',
    portfolio: true,
  },
};

/**
 * Check if user has required role
 */
const hasRole = (minRole) => {
  const requiredRoleLevel = Roles[minRole.toUpperCase()];

  if (requiredRoleLevel === undefined) {
    throw new Error(`Invalid role: ${minRole}`);
  }

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      const userRoleLevel = Roles[req.user.role?.toUpperCase()] || Roles.USER;

      if (userRoleLevel < requiredRoleLevel) {
        throw new ErrorResponse(`Insufficient privileges. ${minRole} role required.`, 403);
      }

      next();

    } catch (error) {
      logger.error('Role check error:', error);

      if (error instanceof ErrorResponse) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'INSUFFICIENT_ROLE',
          requiredRole: minRole,
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
 * Check if user has required permission
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      // Super admins have all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Get user role
      const userRole = Roles[req.user.role?.toUpperCase()] || Roles.USER;

      // Get permissions for user's role
      const rolePermissions = RolePermissions[userRole] || [];

      // Check if user has the required permission
      if (!rolePermissions.includes(permission)) {
        throw new ErrorResponse('Permission denied', 403);
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
 * Check if user has all required permissions
 */
const hasAllPermissions = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      // Super admins have all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Get user role
      const userRole = Roles[req.user.role?.toUpperCase()] || Roles.USER;

      // Get permissions for user's role
      const rolePermissions = RolePermissions[userRole] || [];

      // Check if user has all required permissions
      const hasAll = permissions.every(permission =>
        rolePermissions.includes(permission)
      );

      if (!hasAll) {
        const missing = permissions.filter(p => !rolePermissions.includes(p));
        throw new ErrorResponse(`Missing required permissions: ${missing.join(', ')}`, 403);
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
 * Check if user has at least one of the required permissions
 */
const hasAnyPermission = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      // Super admins have all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Get user role
      const userRole = Roles[req.user.role?.toUpperCase()] || Roles.USER;

      // Get permissions for user's role
      const rolePermissions = RolePermissions[userRole] || [];

      // Check if user has at least one of the required permissions
      const hasAny = permissions.some(permission =>
        rolePermissions.includes(permission)
      );

      if (!hasAny) {
        throw new ErrorResponse('Permission denied', 403);
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
 * Check feature availability for user's subscription
 */
const checkFeatureAccess = (feature) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      const tier = req.user.subscriptionTier || 'free';
      const limits = FeatureLimits[tier] || FeatureLimits.free;

      // Check if feature is available
      if (limits[feature] === false) {
        throw new ErrorResponse(
          `This feature is not available in your current plan. Please upgrade to access this feature.`,
          403
        );
      }

      // Attach feature limits to request
      req.featureLimits = limits;

      next();

    } catch (error) {
      logger.error('Feature access check error:', error);

      if (error instanceof ErrorResponse) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'FEATURE_NOT_AVAILABLE',
          requiredPlan: 'pro',
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
 * Check usage limits for user's subscription
 */
const checkUsageLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Authentication required', 401);
      }

      const tier = req.user.subscriptionTier || 'free';
      const limits = FeatureLimits[tier] || FeatureLimits.free;

      // Get current usage from database
      // This would typically be cached in Redis
      const currentUsage = await getCurrentUsage(req.user.userId, resourceType);
      const maxUsage = limits[`${resourceType}Max`] || limits[`${resourceType}s`];

      // Check if unlimited
      if (maxUsage === -1) {
        return next();
      }

      // Check if limit exceeded
      if (currentUsage >= maxUsage) {
        throw new ErrorResponse(
          `You have reached your ${resourceType} limit (${maxUsage}). Please upgrade your plan to continue.`,
          403
        );
      }

      // Attach usage info to request
      req.usage = {
        current: currentUsage,
        max: maxUsage,
        remaining: maxUsage - currentUsage,
      };

      next();

    } catch (error) {
      logger.error('Usage limit check error:', error);

      if (error instanceof ErrorResponse) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'USAGE_LIMIT_EXCEEDED',
          currentUsage: req.usage?.current || 0,
          maxUsage: req.usage?.max || 0,
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
 * Admin-only access
 */
const isAdmin = (req, res, next) => {
  return hasRole('admin')(req, res, next);
};

/**
 * Super admin-only access
 */
const isSuperAdmin = (req, res, next) => {
  return hasRole('super_admin')(req, res, next);
};

/**
 * Get current usage for a resource type
 * This would typically query the database or cache
 */
const getCurrentUsage = async (userId, resourceType) => {
  // Implementation depends on your data model
  // Example:
  // - For resumes: count resumes in database
  // - For AI credits: check usage table
  // This should be cached in Redis for performance

  return 0; // Placeholder
};

module.exports = {
  Roles,
  Permissions,
  RolePermissions,
  FeatureLimits,
  hasRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  checkFeatureAccess,
  checkUsageLimit,
  isAdmin,
  isSuperAdmin,
};
