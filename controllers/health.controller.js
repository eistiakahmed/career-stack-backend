/**
 * Health Controller
 * Handles health check and status endpoints
 */

const { successResponse } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const database = require('../config/database.config');
const redis = require('../config/redis.config');
const logger = require('../utils/logger');

class HealthController {
  /**
   * Health check endpoint
   */
  healthCheck = asyncHandler(async (req, res) => {
    try {
      const [dbHealth, redisHealth] = await Promise.all([
        database.healthCheck(),
        redis.healthCheck(),
      ]);

      const isHealthy = dbHealth.status === 'healthy' && redisHealth.status === 'healthy';

      const health = {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
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
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
          },
          cpu: process.cpuUsage(),
        },
      };

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

  /**
   * Readiness probe
   */
  readiness = asyncHandler(async (req, res) => {
    try {
      // Check if database is ready
      const dbState = database.getConnectionState();
      if (dbState.state !== 'connected') {
        return res.status(503).json({
          status: 'not_ready',
          message: 'Database not connected',
        });
      }

      // Check if Redis is ready
      const redisHealth = await redis.healthCheck();
      if (redisHealth.status !== 'healthy') {
        return res.status(503).json({
          status: 'not_ready',
          message: 'Redis not connected',
        });
      }

      return res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Readiness check failed:', error);

      return res.status(503).json({
        status: 'not_ready',
        error: error.message,
      });
    }
  });

  /**
   * Liveness probe
   */
  liveness = asyncHandler(async (req, res) => {
    return res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * Detailed status
   */
  status = asyncHandler(async (req, res) => {
    try {
      const dbStats = await database.getStats();
      const redisStats = await redis.healthCheck();

      const status = {
        application: {
          name: 'Resume Builder API',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          startTime: new Date(Date.now() - process.uptime() * 1000),
        },
        database: dbStats,
        cache: redisStats,
        features: {
          ai: process.env.ENABLE_AI_FEATURES === 'true',
          publicPortfolio: process.env.ENABLE_PUBLIC_PORTFOLIO === 'true',
          templates: process.env.ENABLE_TEMPLATES === 'true',
          exportPdf: process.env.ENABLE_EXPORT_PDF === 'true',
        },
      };

      return successResponse(res, status, 'Status retrieved successfully');
    } catch (error) {
      logger.error('Status check failed:', error);

      return res.status(500).json({
        success: false,
        message: 'Status check failed',
        error: error.message,
      });
    }
  });
}

module.exports = new HealthController();
