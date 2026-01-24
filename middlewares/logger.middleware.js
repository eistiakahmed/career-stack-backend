/**
 * Logger Middleware
 * Request/response logging middleware
 */

const logger = require('../utils/logger');
const { extractIP, parseUserAgent } = require('../utils/helpers');

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: extractIP(req),
    userAgent: req.headers['user-agent'],
    userId: req.user?.userId,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.responseData = data;
    originalSend.apply(res, arguments);
  };

  // Log response after it's sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip: extractIP(req),
      userId: req.user?.userId,
      userAgent: parseUserAgent(req.headers['user-agent']),
    };

    if (statusCode >= 400) {
      logger.error('Request failed', logData);
    } else if (statusCode >= 300) {
      logger.warn('Request redirected', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * Detailed request logger (for debugging)
 */
const detailedRequestLogger = (req, res, next) => {
  logger.debug('Request details', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    query: req.query,
    params: req.params,
    body: req.method !== 'GET' ? req.body : undefined,
    ip: extractIP(req),
    userId: req.user?.userId,
  });

  next();
};

/**
 * Error logger middleware
 */
const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: extractIP(req),
    userId: req.user?.userId,
    body: req.body,
    query: req.query,
  });

  next(err);
};

module.exports = {
  requestLogger,
  detailedRequestLogger,
  errorLogger,
};
