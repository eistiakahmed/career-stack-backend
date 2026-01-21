/**
 * Custom Error Classes
 * Application-specific error types for better error handling
 */

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorResponse extends AppError {
  constructor(message, statusCode = 500, code = 'ERROR') {
    super(message, statusCode, code);
  }
}

// 400 Bad Request
class BadRequestError extends ErrorResponse {
  constructor(message = 'Bad Request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

// 401 Unauthorized
class UnauthorizedError extends ErrorResponse {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// 403 Forbidden
class ForbiddenError extends ErrorResponse {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

// 404 Not Found
class NotFoundError extends ErrorResponse {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

// 409 Conflict
class ConflictError extends ErrorResponse {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

// 422 Unprocessable Entity
class ValidationError extends ErrorResponse {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

// 429 Too Many Requests
class RateLimitError extends ErrorResponse {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

// 500 Internal Server Error
class InternalServerError extends ErrorResponse {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

// 503 Service Unavailable
class ServiceUnavailableError extends ErrorResponse {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

// Database Errors
class DatabaseError extends ErrorResponse {
  constructor(message = 'Database error') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// Authentication Errors
class AuthenticationError extends ErrorResponse {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_FAILED');
  }
}

class TokenExpiredError extends ErrorResponse {
  constructor(message = 'Token has expired') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

class InvalidTokenError extends ErrorResponse {
  constructor(message = 'Invalid token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

// Authorization Errors
class AuthorizationError extends ErrorResponse {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'PERMISSION_DENIED');
  }
}

// Payment Errors
class PaymentError extends ErrorResponse {
  constructor(message = 'Payment error') {
    super(message, 402, 'PAYMENT_ERROR');
  }
}

class SubscriptionError extends ErrorResponse {
  constructor(message = 'Subscription error') {
    super(message, 403, 'SUBSCRIPTION_ERROR');
  }
}

// File Upload Errors
class FileUploadError extends ErrorResponse {
  constructor(message = 'File upload error') {
    super(message, 400, 'FILE_UPLOAD_ERROR');
  }
}

// AI/ML Errors
class AIServiceError extends ErrorResponse {
  constructor(message = 'AI service error') {
    super(message, 500, 'AI_SERVICE_ERROR');
  }
}

// External Service Errors
class ExternalServiceError extends ErrorResponse {
  constructor(message = 'External service error') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

module.exports = {
  AppError,
  ErrorResponse,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  AuthorizationError,
  PaymentError,
  SubscriptionError,
  FileUploadError,
  AIServiceError,
  ExternalServiceError,
};
