/**
 * Server Entry Point
 * Starts the Express server and initializes all services
 */

const app = require('./app');
const config = require('./config/env.config');
const database = require('./config/database.config');
const redis = require('./config/redis.config');
const logger = require('./utils/logger');
const queue = require('./workers/queue');

// ============================================
// Server Startup
// ============================================

const startServer = async () => {
  try {
    logger.info('Starting Resume Builder API...');
    logger.info(`Environment: ${config.env}`);
    logger.info(`Port: ${config.port}`);

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await database.connect();
    logger.info('✓ MongoDB connected');

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await redis.connect();
    logger.info('✓ Redis connected');

    // Start background job queue
    if (config.features.ai || config.features.exportPdf) {
      logger.info('Starting job queue...');
      await queue.startQueue();
      logger.info('✓ Job queue started');
    }

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info('✓ Server started successfully');
      logger.info(`✓ API available at http://localhost:${config.port}${config.apiPrefix}/${config.apiVersion}`);
      logger.info(`✓ Health check at http://localhost:${config.port}/api/health`);

      if (config.isDevelopment) {
        logger.info('Running in development mode');
      } else if (config.isProduction) {
        logger.info('Running in production mode');
      }
    });

    // Store server reference for graceful shutdown
    app.set('server', server);

    // Set server timeout
    server.setTimeout(30000); // 30 seconds

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// Start the Server
// ============================================

startServer();

// ============================================
// Global Error Handlers
// ============================================

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ============================================
// Graceful Shutdown
// ============================================

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const server = app.get('server');
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  // Close database connections
  try {
    await database.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }

  // Close Redis connections
  try {
    await redis.disconnect();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }

  // Close job queue
  try {
    await queue.closeQueue();
    logger.info('Job queue closed');
  } catch (error) {
    logger.error('Error closing job queue:', error);
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
