/**
 * Application Constants
 * Centralized constant definitions
 */

// User Roles
const USER_ROLES = {
  GUEST: 'guest',
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

// User Status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
  DELETED: 'deleted',
};

// Subscription Tiers
const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
};

// Subscription Status
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  TRIALING: 'trialing',
};

// Resume Status
const RESUME_STATUS = {
  DRAFT: 'draft',
  COMPLETE: 'complete',
  ARCHIVED: 'archived',
};

// Template Categories
const TEMPLATE_CATEGORIES = {
  MINIMAL: 'minimal',
  CORPORATE: 'corporate',
  EXECUTIVE: 'executive',
  DEVELOPER: 'developer',
  CREATIVE: 'creative',
  ATS: 'ats',
  MODERN: 'modern',
  STARTUP: 'startup',
};

// Employment Types
const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
  OTHER: 'other',
};

// Skill Categories
const SKILL_CATEGORIES = {
  TECHNICAL: 'technical',
  SOFT: 'soft',
  LANGUAGE: 'language',
  TOOL: 'tool',
  FRAMEWORK: 'framework',
  DATABASE: 'database',
  OTHER: 'other',
};

// Skill Proficiency Levels
const SKILL_PROFICIENCY = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
  NATIVE: 'native',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Codes
const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  SUBSCRIPTION_ERROR: 'SUBSCRIPTION_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
};

// AI Optimization Types
const AI_OPTIMIZATION_TYPES = {
  IMPROVE_SUMMARY: 'improve_summary',
  ENHANCE_ACHIEVEMENTS: 'enhance_achievements',
  OPTIMIZE_KEYWORDS: 'optimize_keywords',
  IMPROVE_CONTENT: 'improve_content',
  GENERATE_OBJECTIVE: 'generate_objective',
  SUGGEST_SKILLS: 'suggest_skills',
};

// PDF Export Formats
const EXPORT_FORMATS = {
  PDF: 'pdf',
  DOCX: 'docx',
  TXT: 'txt',
};

// PDF Quality Levels
const PDF_QUALITY = {
  STANDARD: 'standard',
  HIGH: 'high',
  PREMIUM: 'premium',
};

// File Types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
const ALLOWED_RESUME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Time Constants
const TIME = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
};

// Cache Keys
const CACHE_KEYS = {
  USER: (id) => `user:${id}`,
  RESUME: (id) => `resume:${id}`,
  TEMPLATE: (id) => `template:${id}`,
  SESSION: (id) => `session:${id}`,
  RATE_LIMIT: (id, type) => `rate_limit:${type}:${id}`,
};

// Job Priorities (for Bull Queue)
const JOB_PRIORITIES = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 8,
  CRITICAL: 10,
};

// Job Types
const JOB_TYPES = {
  PDF_GENERATION: 'pdf_generation',
  AI_OPTIMIZATION: 'ai_optimization',
  ATS_ANALYSIS: 'ats_analysis',
  EMAIL_SEND: 'email_send',
  CACHE_WARM: 'cache_warm',
  CLEANUP: 'cleanup',
};

// Email Templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  SUBSCRIPTION_CONFIRMED: 'subscription_confirmed',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  INVOICE_READY: 'invoice_ready',
};

// Feature Flags
const FEATURES = {
  AI_FEATURES: 'ai_features',
  PUBLIC_PORTFOLIO: 'public_portfolio',
  TEMPLATES: 'templates',
  EXPORT_PDF: 'export_pdf',
  ADVANCED_ANALYTICS: 'advanced_analytics',
};

// Plans Configuration
const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: {
      maxResumes: 3,
      aiCredits: 5,
      templates: ['basic'],
      exportQuality: 'standard',
      portfolio: false,
      support: 'community',
    },
  },
  PRO_MONTHLY: {
    name: 'Pro Monthly',
    price: 19,
    currency: 'USD',
    interval: 'month',
    features: {
      maxResumes: -1, // Unlimited
      aiCredits: -1,
      templates: 'all',
      exportQuality: 'high',
      portfolio: true,
      support: 'priority',
    },
  },
  PRO_YEARLY: {
    name: 'Pro Yearly',
    price: 190,
    currency: 'USD',
    interval: 'year',
    features: {
      maxResumes: -1,
      aiCredits: -1,
      templates: 'all',
      exportQuality: 'high',
      portfolio: true,
      support: 'priority',
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null, // Custom pricing
    currency: 'USD',
    interval: 'year',
    features: {
      maxResumes: -1,
      aiCredits: -1,
      templates: 'all',
      exportQuality: 'premium',
      portfolio: true,
      support: 'dedicated',
      apiAccess: true,
      customTemplates: true,
      sso: true,
    },
  },
};

// Regex Patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  URL: /^https?:\/\/.+/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// Date Formats
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_FULL: 'MMMM DD, YYYY',
  MONTH_YEAR: 'MMM YYYY',
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUS,
  RESUME_STATUS,
  TEMPLATE_CATEGORIES,
  EMPLOYMENT_TYPES,
  SKILL_CATEGORIES,
  SKILL_PROFICIENCY,
  HTTP_STATUS,
  ERROR_CODES,
  AI_OPTIMIZATION_TYPES,
  EXPORT_FORMATS,
  PDF_QUALITY,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_RESUME_TYPES,
  PAGINATION,
  TIME,
  CACHE_KEYS,
  JOB_PRIORITIES,
  JOB_TYPES,
  EMAIL_TEMPLATES,
  FEATURES,
  PLANS,
  PATTERNS,
  DATE_FORMATS,
};
