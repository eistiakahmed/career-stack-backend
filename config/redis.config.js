/**
 * Redis Configuration
 * Handles Redis connection for caching, sessions, and queues
 */

const Redis = require('ioredis');
const config = require('./env.config');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.clients = {
      main: null,
      cache: null,
      session: null,
      queue: null,
    };
  }

  /**
   * Initialize all Redis connections
   */
  async connect() {
    try {
      // Parse Redis URI
      const redisUrl = new URL(config.redis.uri);
      const connectionOptions = {
        host: redisUrl.hostname || 'localhost',
        port: parseInt(redisUrl.port) || 6379,
        password: config.redis.password || undefined,
        db: parseInt(redisUrl.pathname.slice(1)) || config.redis.db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          logger.warn(`Redis reconnection attempt ${times}, delaying ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      };

      // Main Redis client
      this.clients.main = new Redis({
        ...connectionOptions,
        db: 0,
      });

      // Cache client (db 1)
      this.clients.cache = new Redis({
        ...connectionOptions,
        db: 1,
      });

      // Session client (db 2)
      this.clients.session = new Redis({
        ...connectionOptions,
        db: 2,
      });

      // Queue client (db 3)
      this.clients.queue = new Redis({
        ...connectionOptions,
        db: 3,
      });

      // Setup event handlers for all clients
      Object.entries(this.clients).forEach(([name, client]) => {
        this.setupClientEvents(client, name);
      });

      // Connect all clients manually
      await Promise.all([
        this.clients.main.connect(),
        this.clients.cache.connect(),
        this.clients.session.connect(),
        this.clients.queue.connect(),
      ]);

      logger.info('All Redis clients connected successfully');

      return this.clients;

    } catch (error) {
      logger.error('Redis connection error:', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for Redis client
   */
  setupClientEvents(client, name) {
    client.on('connect', () => {
      logger.info(`Redis ${name} client connecting`);
    });

    client.on('ready', () => {
      logger.info(`Redis ${name} client ready`);
    });

    client.on('error', (error) => {
      logger.error(`Redis ${name} client error:`, error);
    });

    client.on('close', () => {
      logger.warn(`Redis ${name} client connection closed`);
    });

    client.on('reconnecting', () => {
      logger.info(`Redis ${name} client reconnecting`);
    });

    client.on('end', () => {
      logger.info(`Redis ${name} client connection ended`);
    });
  }

  /**
   * Get main Redis client
   */
  getMain() {
    return this.clients.main;
  }

  /**
   * Get cache Redis client
   */
  getCache() {
    return this.clients.cache;
  }

  /**
   * Get session Redis client
   */
  getSession() {
    return this.clients.session;
  }

  /**
   * Get queue Redis client
   */
  getQueue() {
    return this.clients.queue;
  }

  /**
   * Cache wrapper with prefix and TTL
   */
  async cacheSet(key, value, ttl = config.redis.ttl) {
    try {
      const prefixedKey = `${config.redis.prefix}${key}`;
      const serializedValue = JSON.stringify(value);

      if (ttl > 0) {
        await this.clients.cache.setex(prefixedKey, ttl, serializedValue);
      } else {
        await this.clients.cache.set(prefixedKey, serializedValue);
      }

      logger.debug(`Cache set: ${prefixedKey}`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cached value
   */
  async cacheGet(key) {
    try {
      const prefixedKey = `${config.redis.prefix}${key}`;
      const value = await this.clients.cache.get(prefixedKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cached value
   */
  async cacheDelete(key) {
    try {
      const prefixedKey = `${config.redis.prefix}${key}`;
      await this.clients.cache.del(prefixedKey);
      logger.debug(`Cache deleted: ${prefixedKey}`);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple cache keys by pattern
   */
  async cacheDeletePattern(pattern) {
    try {
      const prefixedPattern = `${config.redis.prefix}${pattern}`;
      const keys = await this.clients.cache.keys(prefixedPattern);

      if (keys.length > 0) {
        await this.clients.cache.del(...keys);
        logger.debug(`Cache deleted pattern: ${prefixedPattern}, count: ${keys.length}`);
      }

      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Clear all cache (USE WITH CAUTION)
   */
  async cacheClear() {
    try {
      const pattern = `${config.redis.prefix}*`;
      const keys = await this.clients.cache.keys(pattern);

      if (keys.length > 0) {
        await this.clients.cache.del(...keys);
        logger.info(`Cache cleared: ${keys.length} keys deleted`);
      }

      return keys.length;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return 0;
    }
  }

  /**
   * Increment counter
   */
  async increment(key, expiry = 3600) {
    try {
      const prefixedKey = `${config.redis.prefix}${key}`;
      const result = await this.clients.main.incr(prefixedKey);

      // Set expiry on first increment
      if (result === 1) {
        await this.clients.main.expire(prefixedKey, expiry);
      }

      return result;
    } catch (error) {
      logger.error(`Increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get counter value
   */
  async getCounter(key) {
    try {
      const prefixedKey = `${config.redis.prefix}${key}`;
      const value = await this.clients.main.get(prefixedKey);
      return value ? parseInt(value) : 0;
    } catch (error) {
      logger.error(`Get counter error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Reset counter
   */
  async resetCounter(key) {
    try {
      const prefixedKey = `${config.redis.prefix}${key}`;
      await this.clients.main.del(prefixedKey);
      return true;
    } catch (error) {
      logger.error(`Reset counter error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Acquire distributed lock
   */
  async acquireLock(lockKey, ttl = 10) {
    try {
      const prefixedKey = `${config.redis.prefix}lock:${lockKey}`;
      const lockValue = Date.now().toString();
      const result = await this.clients.main.set(prefixedKey, lockValue, 'PX', ttl * 1000, 'NX');

      return result === 'OK' ? lockValue : null;
    } catch (error) {
      logger.error(`Acquire lock error for ${lockKey}:`, error);
      return null;
    }
  }

  /**
   * Release distributed lock
   */
  async releaseLock(lockKey, lockValue) {
    try {
      const prefixedKey = `${config.redis.prefix}lock:${lockKey}`;

      // Only release if still holding the lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      await this.clients.main.eval(script, 1, prefixedKey, lockValue);
      return true;
    } catch (error) {
      logger.error(`Release lock error for ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Health check for Redis
   */
  async healthCheck() {
    try {
      const pingResult = await this.clients.main.ping();
      const info = await this.clients.main.info('server');

      return {
        status: pingResult === 'PONG' ? 'healthy' : 'unhealthy',
        message: 'Redis connection is active',
        connected: this.clients.main.status === 'ready',
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        connected: false,
      };
    }
  }

  /**
   * Parse Redis INFO command output
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const parsed = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          parsed[key] = value;
        }
      }
    }

    return {
      version: parsed.redis_version,
      uptime: parsed.uptime_in_days,
      connectedClients: parsed.connected_clients,
      usedMemory: parsed.used_memory_human,
      totalCommands: parsed.total_commands_processed,
      operationsPerSec: parsed.instantaneous_ops_per_sec,
    };
  }

  /**
   * Gracefully close all Redis connections
   */
  async disconnect() {
    try {
      await Promise.all([
        this.clients.main?.quit(),
        this.clients.cache?.quit(),
        this.clients.session?.quit(),
        this.clients.queue?.quit(),
      ]);

      logger.info('All Redis clients disconnected');
      this.clients = { main: null, cache: null, session: null, queue: null };
    } catch (error) {
      logger.error('Error disconnecting Redis clients:', error);
      throw error;
    }
  }

  /**
   * Flush all databases (USE WITH CAUTION - Test only)
   */
  async flushAll() {
    if (config.isProduction) {
      throw new Error('Cannot flush Redis in production');
    }

    try {
      await Promise.all([
        this.clients.main.flushdb(),
        this.clients.cache.flushdb(),
        this.clients.session.flushdb(),
        this.clients.queue.flushdb(),
      ]);

      logger.info('All Redis databases flushed (test environment)');
    } catch (error) {
      logger.error('Error flushing Redis databases:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new RedisClient();
