/**
 * Security Utilities
 * Handles encryption, hashing, JWT token generation, and data sanitization
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env.config');

/**
 * AES-256-GCM Encryption
 * For encrypting sensitive data at rest
 */
class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(config.security.encryptionKey, 'hex');
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} text - Text to encrypt
   * @returns {object} Encrypted data with IV and auth tag
   */
  encrypt(text) {
    try {
      // Generate random initialization vector
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {object} encryptedData - Object containing encrypted, iv, and authTag
   * @returns {string} Decrypted text
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );

      // Set authentication tag
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {string} Hex digest
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate random token
   * @param {number} length - Token length in bytes
   * @returns {string} Random hex token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate random string
   * @param {number} length - String length
   * @returns {string} Random alphanumeric string
   */
  generateRandomString(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(crypto.randomBytes(1)[0] % chars.length));
    }

    return result;
  }

  /**
   * Generate API key
   * @returns {string} API key with prefix
   */
  generateApiKey() {
    const prefix = 'rb_'; // Resume Builder prefix
    const key = crypto.randomBytes(32).toString('base64url');
    return `${prefix}${key}`;
  }
}

/**
 * Password hashing and verification using bcrypt
 */
class PasswordManager {
  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hash(password) {
    try {
      const salt = await bcrypt.genSalt(config.security.bcryptRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async verify(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Password verification failed: ${error.message}`);
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} Validation result with score and feedback
   */
  validateStrength(password) {
    const result = {
      valid: true,
      score: 0,
      feedback: [],
    };

    // Minimum length check
    if (password.length < 8) {
      result.valid = false;
      result.feedback.push('Password must be at least 8 characters long');
    } else {
      result.score += 1;
    }

    // Maximum length check
    if (password.length > 128) {
      result.valid = false;
      result.feedback.push('Password must not exceed 128 characters');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      result.score += 1;
    } else {
      result.feedback.push('Password must contain at least one lowercase letter');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      result.score += 1;
    } else {
      result.feedback.push('Password must contain at least one uppercase letter');
    }

    // Number check
    if (/[0-9]/.test(password)) {
      result.score += 1;
    } else {
      result.feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.score += 1;
    } else {
      result.feedback.push('Password must contain at least one special character');
    }

    // Common password check
    const commonPasswords = [
      'password', '12345678', 'qwerty', 'abc123', 'password1',
      '123456789', 'welcome', 'monkey', 'dragon', 'master'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      result.valid = false;
      result.feedback.push('This is a commonly used password');
    }

    return result;
  }
}

/**
 * JWT Token Management
 */
class TokenManager {
  /**
   * Generate access token
   * @param {object} payload - Token payload (user data)
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.accessExpiry,
        issuer: config.jwt.issuer,
        audience: 'resume-builder-users',
        subject: payload.userId?.toString(),
      });
    } catch (error) {
      throw new Error(`Access token generation failed: ${error.message}`);
    }
  }

  /**
   * Generate refresh token
   * @param {object} payload - Token payload
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiry,
        issuer: config.jwt.issuer,
        audience: 'resume-builder-refresh',
        subject: payload.userId?.toString(),
      });
    } catch (error) {
      throw new Error(`Refresh token generation failed: ${error.message}`);
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param {object} payload - Token payload
   * @returns {object} Object containing access and refresh tokens
   */
  generateTokenPair(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: config.jwt.accessExpiry,
    };
  }

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: 'resume-builder-users',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      } else {
        throw new Error(`Token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: config.jwt.issuer,
        audience: 'resume-builder-refresh',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error(`Refresh token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Decode token without verification (for getting token info)
   * @param {string} token - JWT token
   * @returns {object} Decoded token payload
   */
  decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date} Expiration date
   */
  getTokenExpiration(token) {
    const decoded = this.decodeToken(token);
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Generate email verification token
   * @param {string} email - User email
   * @returns {string} Verification token
   */
  generateEmailVerificationToken(email) {
    const payload = {
      email,
      type: 'email_verification',
      timestamp: Date.now(),
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: '24h',
      issuer: config.jwt.issuer,
    });
  }

  /**
   * Generate password reset token
   * @param {string} email - User email
   * @returns {string} Reset token
   */
  generatePasswordResetToken(email) {
    const payload = {
      email,
      type: 'password_reset',
      timestamp: Date.now(),
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: '1h',
      issuer: config.jwt.issuer,
    });
  }

  /**
   * Verify email verification token
   * @param {string} token - Verification token
   * @returns {object} Decoded payload
   */
  verifyEmailToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
      });

      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {object} Decoded payload
   */
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
      });

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      // Check if token is older than 1 hour
      const age = Date.now() - decoded.timestamp;
      if (age > 3600000) { // 1 hour in milliseconds
        throw new Error('Reset token expired');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Password reset verification failed: ${error.message}`);
    }
  }
}

/**
 * Input Sanitization
 */
class Sanitizer {
  /**
   * Sanitize string input
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(input) {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }

  /**
   * Sanitize email
   * @param {string} email - Email to sanitize
   * @returns {string} Sanitized email
   */
  sanitizeEmail(email) {
    if (typeof email !== 'string') {
      return email;
    }

    return email.toLowerCase().trim();
  }

  /**
   * Sanitize phone number
   * @param {string} phone - Phone number to sanitize
   * @returns {string} Sanitized phone number
   */
  sanitizePhone(phone) {
    if (typeof phone !== 'string') {
      return phone;
    }

    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Sanitize object (recursive)
   * @param {object} obj - Object to sanitize
   * @returns {object} Sanitized object
   */
  sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Remove sensitive fields from object
   * @param {object} obj - Object to clean
   * @param {array} fields - Fields to remove
   * @returns {object} Cleaned object
   */
  removeSensitiveFields(obj, fields = ['password', 'pin', 'secret']) {
    const cleaned = { ...obj };

    for (const field of fields) {
      delete cleaned[field];
    }

    return cleaned;
  }

  /**
   * Mask sensitive data
   * @param {string} data - Data to mask
   * @param {number} visibleChars - Number of visible characters
   * @returns {string} Masked data
   */
  maskSensitiveData(data, visibleChars = 4) {
    if (typeof data !== 'string' || data.length <= visibleChars) {
      return '****';
    }

    return data.substring(0, visibleChars) + '****';
  }

  /**
   * Sanitize MongoDB query (prevent NoSQL injection)
   * @param {object} query - Query object
   * @returns {object} Sanitized query
   */
  sanitizeMongoQuery(query) {
    const sanitized = {};

    for (const [key, value] of Object.entries(query)) {
      // Only allow specific operators
      if (key.startsWith('$') && ![
        '$eq', '$ne', '$gt', '$gte', '$lt', '$lte',
        '$in', '$nin', '$and', '$or', '$not', '$nor',
        '$exists', '$regex', '$text', '$search'
      ].includes(key)) {
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }
}

/**
 * Rate Limiting Helper
 */
class RateLimiter {
  /**
   * Generate rate limit key
   * @param {string} identifier - IP address or user ID
   * @param {string} action - Action being rate limited
   * @returns {string} Rate limit key
   */
  generateKey(identifier, action) {
    return `rate_limit:${action}:${identifier}`;
  }

  /**
   * Calculate retry delay
   * @param {number} resetTime - Unix timestamp when limit resets
   * @returns {number} Retry delay in seconds
   */
  getRetryAfter(resetTime) {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, resetTime - now);
  }
}

// Export all security utilities
module.exports = {
  Encryption: new Encryption(),
  Password: new PasswordManager(),
  Token: new TokenManager(),
  Sanitizer: new Sanitizer(),
  RateLimiter: new RateLimiter(),
};
