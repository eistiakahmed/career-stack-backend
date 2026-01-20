/**
 * Prisma Database Configuration
 * Handles Prisma Client instantiation and connection management
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const config = require('../config/env.config');

// Create Prisma Client instance
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
  errorFormat: 'pretty',
});

// Log queries in development
if (config.isDevelopment) {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

/**
 * Connect to MongoDB via Prisma
 */
async function connect() {
  try {
    await prisma.$connect();
    logger.info('✓ Prisma connected to MongoDB');
    return prisma;
  } catch (error) {
    logger.error('Prisma connection error:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnect() {
  try {
    await prisma.$disconnect();
    logger.info('✓ Prisma disconnected from MongoDB');
  } catch (error) {
    logger.error('Prisma disconnect error:', error);
    throw error;
  }
}

/**
 * Health check for Prisma connection
 */
async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Get database statistics
 */
async function getStats() {
  try {
    const [userCount, resumeCount, templateCount] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.template.count(),
    ]);

    return {
      users: userCount,
      resumes: resumeCount,
      templates: templateCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  try {
    if (config.isTest) {
      // Delete all test data in parallel
      await Promise.all([
        prisma.event.deleteMany({}),
        prisma.analytics.deleteMany({}),
        prisma.session.deleteMany({}),
        prisma.subscription.deleteMany({}),
        prisma.resume.deleteMany({}),
        prisma.user.deleteMany({}),
      ]);

      logger.info('✓ Test data cleaned up');
    }
  } catch (error) {
    logger.error('Error cleaning up test data:', error);
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Closing Prisma connection...`);

  try {
    await prisma.$disconnect();
    logger.info('✓ Prisma connection closed gracefully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during Prisma shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = {
  prisma,
  connect,
  disconnect,
  healthCheck,
  getStats,
  cleanupTestData,
};
