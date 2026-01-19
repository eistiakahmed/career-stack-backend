/**
 * MongoDB Database Configuration
 * Handles connection pooling, error handling, and connection monitoring
 */

const mongoose = require('mongoose');
const config = require('./env.config');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
    this.isConnecting = false;
  }

  /**
   * Initialize MongoDB connection with connection pooling
   */
  async connect() {
    // Prevent multiple connection attempts
    if (this.connection || this.isConnecting) {
      return this.connection;
    }

    this.isConnecting = true;

    try {
      // Connection options with connection pooling
      const options = {
        // Connection pool settings
        maxPoolSize: config.database.maxPoolSize, // Maximum connections in pool
        minPoolSize: config.database.minPoolSize, // Minimum connections in pool
        maxIdleTimeMS: 30000, // Close idle connections after 30 seconds

        // Timeout settings
        serverSelectionTimeoutMS: config.database.timeout, // Timeout for server selection
        socketTimeoutMS: 45000, // Socket timeout
        connectTimeoutMS: 10000, // Initial connection timeout

        // Retry settings
        retryWrites: true, // Retry failed writes
        retryReads: true, // Retry failed reads

        // Performance optimizations
        bufferCommands: true, // Buffer commands when connection is down

        // Modern MongoDB driver options
        autoIndex: config.isDevelopment, // Auto-build indexes in dev only
        family: 4, // Use IPv4, skip trying IPv6
      };

      // Create connection
      this.connection = await mongoose.connect(config.database.uri, options);

      // Connection event handlers
      this.setupEventHandlers();

      logger.info('MongoDB connected successfully', {
        database: config.database.dbName,
        host: this.connection.connection.host,
        port: this.connection.connection.port,
        poolSize: options.maxPoolSize,
      });

      this.isConnecting = false;
      return this.connection;

    } catch (error) {
      this.isConnecting = false;
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Setup MongoDB connection event handlers
   */
  setupEventHandlers() {
    const db = mongoose.connection;

    // Successful connection
    db.on('connected', () => {
      logger.info('MongoDB connection established');
    });

    // Connection error
    db.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    // Disconnection
    db.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    // Reconnection successful
    db.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Connection closed
    db.on('close', () => {
      logger.info('MongoDB connection closed');
    });

    // Full setup event
    db.once('open', () => {
      logger.info('MongoDB connection is ready for queries');
    });
  }

  /**
   * Gracefully close MongoDB connection
   */
  async disconnect() {
    if (!this.connection) {
      return;
    }

    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed gracefully');
      this.connection = null;
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    if (!this.connection || !this.connection.readyState === 1) {
      throw new Error('Database not connected');
    }

    try {
      const db = this.connection.connection.db;
      const stats = await db.stats();

      return {
        database: config.database.dbName,
        collections: stats.collections,
        dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
        indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
        totalSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
        avgObjSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`,
        objects: stats.objects,
        indexes: stats.indexes,
      };
    } catch (error) {
      logger.error('Error fetching database stats:', error);
      throw error;
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck() {
    try {
      if (!this.connection || this.connection.readyState !== 1) {
        return {
          status: 'unhealthy',
          message: 'Database not connected',
          readyState: this.connection?.readyState || 0,
        };
      }

      // Ping the database
      await this.connection.db.admin().ping();

      return {
        status: 'healthy',
        message: 'Database connection is active',
        host: this.connection.connection.host,
        port: this.connection.connection.port,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
      };
    }
  }

  /**
   * Clear all collections (USE WITH CAUTION - Test only)
   */
  async clearDatabase() {
    if (config.isProduction) {
      throw new Error('Cannot clear database in production');
    }

    if (!this.connection || this.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    try {
      const collections = await this.connection.connection.db.collections();
      for (let collection of collections) {
        await collection.deleteMany({});
      }
      logger.info('Database cleared (test environment)');
    } catch (error) {
      logger.error('Error clearing database:', error);
      throw error;
    }
  }

  /**
   * Drop database (USE WITH CAUTION - Test only)
   */
  async dropDatabase() {
    if (config.isProduction) {
      throw new Error('Cannot drop database in production');
    }

    if (!this.connection || this.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    try {
      await this.connection.connection.db.dropDatabase();
      logger.info('Database dropped (test environment)');
    } catch (error) {
      logger.error('Error dropping database:', error);
      throw error;
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      state: states[mongoose.connection.readyState] || 'unknown',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };
  }
}

// Export singleton instance
module.exports = new Database();
