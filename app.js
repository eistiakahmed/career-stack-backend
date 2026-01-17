/**
 * Express Application Setup
 * Main application configuration and middleware setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./config/env.config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { requestLogger } = require('./middlewares/logger.middleware');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// ============================================
// Trust Proxy (for reverse proxies)
// ============================================
app.set('trust proxy', 1);

// ============================================
// Security Middleware
// ============================================

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      config.clientUrl.production,
      config.clientUrl.development,
    ];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (config.isDevelopment) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
}));

// Rate limiting (basic fallback)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

app.use(limiter);

// Disable x-powered-by header
app.disable('x-powered-by');

// ============================================
// Body Parser Middleware
// ============================================

// Parse JSON bodies
app.use(express.json({
  limit: config.upload.maxFileSize,
  verify: (req, res, buf, encoding) => {
    // Verify raw body for webhooks
    req.rawBody = buf.toString(encoding || 'utf8');
  },
}));

// Parse URL-encoded bodies
app.use(express.urlencoded({
  extended: true,
  limit: config.upload.maxFileSize,
}));

// Cookie parser
app.use(cookieParser());

// ============================================
// Compression
// ============================================

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
}));

// ============================================
// Logging
// ============================================

// Request logging with Morgan
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Custom request logger
app.use(requestLogger);

// ============================================
// Static Files (if needed)
// ============================================

// app.use('/static', express.static('public'));

// ============================================
// API Routes
// ============================================

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Resume Builder API',
    version: config.apiVersion,
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use(`${config.apiPrefix}/${config.apiVersion}`, routes);

// Health check endpoint (must be before error handlers)
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/database.config');
    const redis = require('./config/redis.config');

    const [dbHealth, redisHealth] = await Promise.all([
      db.healthCheck(),
      redis.healthCheck(),
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: config.apiVersion,
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        },
        cpu: process.cpuUsage(),
      },
    };

    // Set overall health status
    const isHealthy = dbHealth.status === 'healthy' && redisHealth.status === 'healthy';
    health.status = isHealthy ? 'healthy' : 'degraded';

    return res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// ============================================
// Error Handlers
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// Graceful Shutdown
// ============================================

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  const server = app.get('server');
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connection
        const db = require('./config/database.config');
        await db.disconnect();

        // Close Redis connections
        const redis = require('./config/redis.config');
        await redis.disconnect();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000); // 30 seconds
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;
