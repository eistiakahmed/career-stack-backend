/**
 * Authentication Service
 * Handles user registration, login, and authentication operations
 */

const userRepository = require('../../repositories/user.repository');
const { Password, Token, Encryption } = require('../../utils/security');
const redis = require('../../config/redis.config');
const {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} = require('../../utils/error');
const logger = require('../../utils/logger');
const config = require('../../config/env.config');

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await userRepository.emailExists(userData.email);
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const hashedPassword = await Password.hash(userData.password);

      // Create user
      const user = await userRepository.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store session in Redis
      await this.storeSession(user._id, tokens);

      // Send verification email (in background)
      // await this.sendVerificationEmail(user, verificationToken);

      logger.info('User registered', {
        userId: user._id,
        email: user.email,
      });

      return {
        user: this.sanitizeUser(user),
        tokens,
        requiresVerification: !user.isEmailVerified,
      };
    } catch (error) {
      logger.error('Register error:', error);
      throw error;
    }
  }

  /**
   * Social OAuth authentication
   */
  async socialAuth({ provider, token, email, firstName, lastName }) {
    try {
      // Check if user exists with this email
      let user = await userRepository.findByEmail(email);

      if (user) {
        // Existing user - update OAuth info if needed
        if (!user.oauthProviders) {
          user.oauthProviders = {};
        }
        user.oauthProviders[provider] = {
          id: token,
          email,
        };
        await user.save();
      } else {
        // New user - create account
        user = await userRepository.createUser({
          email,
          firstName,
          lastName,
          isEmailVerified: true, // OAuth emails are pre-verified
          oauthProviders: {
            [provider]: {
              id: token,
              email,
            },
          },
        });
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store session in Redis
      await this.storeSession(user._id, tokens);

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens,
        requiresVerification: false,
      };
    } catch (error) {
      logger.error('Social auth error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password, deviceInfo = {}) {
    try {
      // Find user
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check if account is active
      if (user.status !== 'active') {
        throw new UnauthorizedError('Account is not active');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store session in Redis
      await this.storeSession(user._id, tokens, deviceInfo);

      // Update login info
      await userRepository.updateLoginInfo(user._id, deviceInfo.ip);

      logger.info('User logged in', {
        userId: user._id,
        email: user.email,
      });

      return {
        user: this.sanitizeUser(user),
        tokens,
        requiresTwoFactor: user.twoFactorEnabled,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = Token.verifyRefreshToken(refreshToken);

      // Check if refresh token exists in Redis
      const storedToken = await redis.cacheGet(`refresh_token:${decoded.userId}`);

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Get user
      const user = await userRepository.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new tokens
      const newTokens = Token.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      });

      // Update session
      await redis.cacheSet(
        `session:${user._id}`,
        {
          ...newTokens,
          userId: user._id.toString(),
        },
        7 * 24 * 60 * 60 // 7 days
      );

      return newTokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId, accessToken) {
    try {
      // Add access token to blacklist
      const decoded = Token.verifyAccessToken(accessToken);
      const ttl = Math.floor((decoded.exp - Date.now() / 1000));

      if (ttl > 0) {
        await redis.cacheSet(`blacklist:${accessToken}`, true, ttl);
      }

      // Remove session from Redis
      await redis.cacheDelete(`session:${userId}`);

      // Remove refresh token
      await redis.cacheDelete(`refresh_token:${userId}`);

      logger.info('User logged out', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    try {
      // Verify token
      const decoded = Token.verifyEmailToken(token);

      // Find user
      const user = await userRepository.findByEmail(decoded.email);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if already verified
      if (user.isEmailVerified) {
        throw new BadRequestError('Email already verified');
      }

      // Verify email
      await userRepository.verifyEmail(user._id);

      logger.info('Email verified', { userId: user._id });

      return { success: true };
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    try {
      // Find user
      const user = await userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return { success: true };
      }

      // Generate reset token
      const { user: updatedUser, resetToken } =
        await userRepository.setPasswordResetToken(user._id);

      // Send reset email (in background)
      // await this.sendPasswordResetEmail(updatedUser, resetToken);

      logger.info('Password reset requested', {
        userId: user._id,
        email: user.email,
      });

      return { success: true };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      // Verify token
      const decoded = Token.verifyPasswordResetToken(token);

      // Find user
      const user = await userRepository.findByEmail(decoded.email);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Hash new password
      const hashedPassword = await Password.hash(newPassword);

      // Update password
      await userRepository.resetPassword(user._id, hashedPassword);

      // Invalidate all sessions
      await this.invalidateAllSessions(user._id);

      logger.info('Password reset', { userId: user._id });

      return { success: true };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await Password.hash(newPassword);

      // Update password
      await userRepository.updatePassword(userId, hashedPassword);

      // Invalidate all sessions (except current)
      // await this.invalidateOtherSessions(userId);

      logger.info('Password changed', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Generate tokens for user
   */
  generateTokens(user) {
    return Token.generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
    });
  }

  /**
   * Store session in Redis
   */
  async storeSession(userId, tokens, deviceInfo = {}) {
    try {
      const sessionData = {
        ...tokens,
        userId: userId.toString(),
        userAgent: deviceInfo.userAgent,
        ip: deviceInfo.ip,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        createdAt: new Date(),
      };

      // Store session
      await redis.cacheSet(
        `session:${userId}`,
        sessionData,
        7 * 24 * 60 * 60 // 7 days
      );

      // Store refresh token separately
      await redis.cacheSet(
        `refresh_token:${userId}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60
      );
    } catch (error) {
      logger.error('Store session error:', error);
      throw error;
    }
  }

  /**
   * Invalidate all sessions for user
   */
  async invalidateAllSessions(userId) {
    try {
      await redis.cacheDelete(`session:${userId}`);
      await redis.cacheDelete(`refresh_token:${userId}`);
      await redis.cacheDeletePattern(`blacklist:${userId}*`);
    } catch (error) {
      logger.error('Invalidate sessions error:', error);
      throw error;
    }
  }

  /**
   * Sanitize user object (remove sensitive fields)
   */
  sanitizeUser(user) {
    const sanitized = user.toJSON ? user.toJSON() : user;

    delete sanitized.password;
    delete sanitized.twoFactorSecret;
    delete sanitized.twoFactorBackupCodes;
    delete sanitized.emailVerificationToken;
    delete sanitized.passwordResetToken;

    return sanitized;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    return Password.validateStrength(password);
  }
}

module.exports = new AuthService();
