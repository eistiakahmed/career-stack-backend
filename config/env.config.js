/**
 * Environment Configuration with Validation
 * Uses Joi for schema validation and fails fast on startup
 */

const Joi = require('joi');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Server Configuration
  PORT: Joi.number().default(3000).min(1000).max(65535),
  API_VERSION: Joi.string().default('v1'),
  API_PREFIX: Joi.string().default('/api'),

  // Client URLs (for CORS)
  CLIENT_URL: Joi.string().uri().required(),
  CLIENT_URL_DEV: Joi.string().uri().allow('', null),

  // Database Configuration
  MONGODB_URI: Joi.string().uri().required(),
  MONGODB_DB_NAME: Joi.string().required(),
  MONGODB_MAX_POOL_SIZE: Joi.number().default(10),
  MONGODB_MIN_POOL_SIZE: Joi.number().default(2),
  MONGODB_TIMEOUT: Joi.number().default(5000),

  // Redis Configuration
  REDIS_URI: Joi.string().uri().required(),
  REDIS_PASSWORD: Joi.string().allow('', null),
  REDIS_DB: Joi.number().default(0),
  REDIS_PREFIX: Joi.string().default('resume_builder:'),
  REDIS_TTL: Joi.number().default(3600), // 1 hour default

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('resume-builder'),

  // Session Configuration
  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_MAX_AGE: Joi.number().default(7 * 24 * 60 * 60 * 1000), // 7 days

  // OpenAI Configuration
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_ORGANIZATION: Joi.string().allow('', null),
  OPENAI_MODEL: Joi.string().default('gpt-4'),
  OPENAI_MAX_TOKENS: Joi.number().default(2000),
  OPENAI_TEMPERATURE: Joi.number().default(0.7).min(0).max(2),
  OPENAI_TIMEOUT: Joi.number().default(30000), // 30 seconds

  // AWS Configuration
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_S3_BUCKET_RESUMES: Joi.string().required(),
  AWS_CLOUDFRONT_DOMAIN: Joi.string().allow('', null),

  // Stripe Configuration
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().required(),

  // Email Configuration (SendGrid/SES)
  EMAIL_FROM: Joi.string().email().required(),
  EMAIL_REPLY_TO: Joi.string().email().required(),
  SENDGRID_API_KEY: Joi.string().allow('', null),
  AWS_SES_REGION: Joi.string().allow('', null),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  AUTH_RATE_LIMIT_MAX: Joi.number().default(5),
  AI_RATE_LIMIT_MAX: Joi.number().default(20),

  // File Upload Configuration
  MAX_FILE_SIZE: Joi.number().default(5 * 1024 * 1024), // 5MB
  ALLOWED_IMAGE_TYPES: Joi.string().default('image/jpeg,image/png,image/jpg'),
  MAX_RESUME_SIZE: Joi.number().default(10 * 1024 * 1024), // 10MB

  // Pagination
  DEFAULT_PAGE: Joi.number().default(1),
  DEFAULT_LIMIT: Joi.number().default(20),
  MAX_LIMIT: Joi.number().default(100),

  // PDF Generation
  PDF_ENGINE_TIMEOUT: Joi.number().default(30000),
  PDF_QUALITY: Joi.string().default('high'),
  PDF_MAX_PAGES: Joi.number().default(5),

  // Queue Configuration (Bull)
  QUEUE_REDIS_HOST: Joi.string().default('localhost'),
  QUEUE_REDIS_PORT: Joi.number().default(6379),
  QUEUE_CONCURRENCY: Joi.number().default(5),
  JOB_MAX_ATTEMPTS: Joi.number().default(3),
  JOB_BACKOFF_TYPE: Joi.string().default('exponential'),
  JOB_BACKOFF_DELAY: Joi.number().default(2000),

  // Analytics
  ANALYTICS_ENABLED: Joi.boolean().default(true),
  MIXPANEL_TOKEN: Joi.string().allow('', null),
  GA_TRACKING_ID: Joi.string().allow('', null),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(12).min(8).max(16),
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  TWO_FACTOR_AUTH_ENABLED: Joi.boolean().default(true),

  // Monitoring & Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  SENTRY_DSN: Joi.string().uri().allow('', null),
  SENTRY_ENVIRONMENT: Joi.string().allow('', null),

  // Feature Flags
  ENABLE_AI_FEATURES: Joi.boolean().default(true),
  ENABLE_PUBLIC_PORTFOLIO: Joi.boolean().default(true),
  ENABLE_TEMPLATES: Joi.boolean().default(true),
  ENABLE_EXPORT_PDF: Joi.boolean().default(true),

  // Subscription Limits
  FREE_PLAN_RESUMES: Joi.number().default(3),
  FREE_PLAN_AI_CREDITS: Joi.number().default(5),
  PRO_PLAN_RESUMES: Joi.number().default(-1), // Unlimited
  PRO_PLAN_AI_CREDITS: Joi.number().default(-1), // Unlimited

}).unknown(true); // Allow unknown variables for flexibility

// Validate and extract environment variables
const { error, value: envVars } = envSchema.validate(process.env, {
  stripUnknown: true,
  convert: true,
});

// Throw error if validation fails
if (error) {
  throw new Error(`Environment validation error: ${error.details[0].message}`);
}

// Export validated environment variables
module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  apiVersion: envVars.API_VERSION,
  apiPrefix: envVars.API_PREFIX,

  clientUrl: {
    production: envVars.CLIENT_URL,
    development: envVars.CLIENT_URL_DEV || envVars.CLIENT_URL,
  },

  database: {
    uri: envVars.MONGODB_URI,
    dbName: envVars.MONGODB_DB_NAME,
    maxPoolSize: envVars.MONGODB_MAX_POOL_SIZE,
    minPoolSize: envVars.MONGODB_MIN_POOL_SIZE,
    timeout: envVars.MONGODB_TIMEOUT,
  },

  redis: {
    uri: envVars.REDIS_URI,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
    prefix: envVars.REDIS_PREFIX,
    ttl: envVars.REDIS_TTL,
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiry: envVars.JWT_ACCESS_EXPIRY,
    refreshExpiry: envVars.JWT_REFRESH_EXPIRY,
    issuer: envVars.JWT_ISSUER,
  },

  session: {
    secret: envVars.SESSION_SECRET,
    maxAge: envVars.SESSION_MAX_AGE,
  },

  openai: {
    apiKey: envVars.OPENAI_API_KEY,
    organization: envVars.OPENAI_ORGANIZATION,
    model: envVars.OPENAI_MODEL,
    maxTokens: envVars.OPENAI_MAX_TOKENS,
    temperature: envVars.OPENAI_TEMPERATURE,
    timeout: envVars.OPENAI_TIMEOUT,
  },

  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    s3: {
      bucket: envVars.AWS_S3_BUCKET,
      resumesBucket: envVars.AWS_S3_BUCKET_RESUMES,
    },
    cloudfront: {
      domain: envVars.AWS_CLOUDFRONT_DOMAIN,
    },
  },

  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
    publishableKey: envVars.STRIPE_PUBLISHABLE_KEY,
  },

  email: {
    from: envVars.EMAIL_FROM,
    replyTo: envVars.EMAIL_REPLY_TO,
    sendgridApiKey: envVars.SENDGRID_API_KEY,
    sesRegion: envVars.AWS_SES_REGION,
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
    authMax: envVars.AUTH_RATE_LIMIT_MAX,
    aiMax: envVars.AI_RATE_LIMIT_MAX,
  },

  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    allowedImageTypes: envVars.ALLOWED_IMAGE_TYPES.split(','),
    maxResumeSize: envVars.MAX_RESUME_SIZE,
  },

  pagination: {
    defaultPage: envVars.DEFAULT_PAGE,
    defaultLimit: envVars.DEFAULT_LIMIT,
    maxLimit: envVars.MAX_LIMIT,
  },

  pdf: {
    engineTimeout: envVars.PDF_ENGINE_TIMEOUT,
    quality: envVars.PDF_QUALITY,
    maxPages: envVars.PDF_MAX_PAGES,
  },

  queue: {
    redisHost: envVars.QUEUE_REDIS_HOST,
    redisPort: envVars.QUEUE_REDIS_PORT,
    concurrency: envVars.QUEUE_CONCURRENCY,
    maxAttempts: envVars.JOB_MAX_ATTEMPTS,
    backoffType: envVars.JOB_BACKOFF_TYPE,
    backoffDelay: envVars.JOB_BACKOFF_DELAY,
  },

  analytics: {
    enabled: envVars.ANALYTICS_ENABLED,
    mixpanelToken: envVars.MIXPANEL_TOKEN,
    gaTrackingId: envVars.GA_TRACKING_ID,
  },

  security: {
    bcryptRounds: envVars.BCRYPT_ROUNDS,
    encryptionKey: envVars.ENCRYPTION_KEY,
    twoFactorEnabled: envVars.TWO_FACTOR_AUTH_ENABLED,
  },

  monitoring: {
    logLevel: envVars.LOG_LEVEL,
    sentryDsn: envVars.SENTRY_DSN,
    sentryEnvironment: envVars.SENTRY_ENVIRONMENT,
  },

  features: {
    ai: envVars.ENABLE_AI_FEATURES,
    publicPortfolio: envVars.ENABLE_PUBLIC_PORTFOLIO,
    templates: envVars.ENABLE_TEMPLATES,
    exportPdf: envVars.ENABLE_EXPORT_PDF,
  },

  limits: {
    freePlan: {
      resumes: envVars.FREE_PLAN_RESUMES,
      aiCredits: envVars.FREE_PLAN_AI_CREDITS,
    },
    proPlan: {
      resumes: envVars.PRO_PLAN_RESUMES,
      aiCredits: envVars.PRO_PLAN_AI_CREDITS,
    },
  },

  isDevelopment: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
};
