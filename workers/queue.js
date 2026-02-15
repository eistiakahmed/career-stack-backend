/**
 * Background Job Queue
 * Bull queue configuration for background job processing
 */

const Queue = require('bull');
const redis = require('../config/redis.config');
const logger = require('../utils/logger');
const config = require('../config/env.config');

// Create queue instance
const resumeQueue = new Queue('resume-processing', {
  redis: {
    host: config.queue.redisHost,
    port: config.queue.redisPort,
    db: 3,
  },
  defaultJobOptions: {
    attempts: config.queue.maxAttempts,
    backoff: {
      type: config.queue.backoffType,
      delay: config.queue.backoffDelay,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// Queue event listeners
resumeQueue.on('completed', (job, result) => {
  logger.info('Job completed', { jobId: job.id, type: job.name, result });
});

resumeQueue.on('failed', (job, err) => {
  logger.error('Job failed', { jobId: job.id, type: job.name, error: err.message });
});

resumeQueue.on('stalled', (job) => {
  logger.warn('Job stalled', { jobId: job.id, type: job.name });
});

/**
 * Start the queue processor
 */
async function startQueue() {
  try {
    await resumeQueue.isReady();
    logger.info('Job queue started successfully');
    return resumeQueue;
  } catch (error) {
    logger.error('Failed to start job queue:', error);
    throw error;
  }
}

/**
 * Add job to queue
 */
async function addJob(type, data, options = {}) {
  try {
    const job = await resumeQueue.add(type, data, options);
    logger.info('Job added to queue', { jobId: job.id, type });
    return job;
  } catch (error) {
    logger.error('Failed to add job to queue:', error);
    throw error;
  }
}

/**
 * Get queue status
 */
async function getQueueStatus() {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      resumeQueue.getWaitingCount(),
      resumeQueue.getActiveCount(),
      resumeQueue.getCompletedCount(),
      resumeQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  } catch (error) {
    logger.error('Failed to get queue status:', error);
    throw error;
  }
}

/**
 * Close queue connection
 */
async function closeQueue() {
  try {
    await resumeQueue.close();
    logger.info('Job queue closed');
  } catch (error) {
    logger.error('Error closing job queue:', error);
    throw error;
  }
}

module.exports = {
  queue: resumeQueue,
  startQueue,
  addJob,
  getQueueStatus,
  closeQueue,
};
