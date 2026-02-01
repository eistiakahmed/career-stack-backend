/**
 * Prisma Authentication Service
 * Authentication business logic using Prisma repositories
 */

const { prisma } = require('../../config/prisma.config');
const { Password, Token } = require('../../utils/security');
const redis = require('../../config/redis.config');
const {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} = require('../../utils/error');
const logger = require('../../utils/logger');
const config = require('../../config/env.config');

class PrismaAuthService {
  /**
   * Register new user
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const hashedPassword = await Password.hash(userData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });

      // Generate email verification token
      const verificationToken = user.emailVerificationToken;

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store session in Redis
      await this.storeSession(user.id, tokens);

      // Send verification email (in background)
      // await this.sendVerificationEmail(user, verificationToken);

      logger.info('User registered successfully', { userId: user.id });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
        },
        tokens,
        requiresVerification: !user.isEmailVerified,
      };
    } catch (error) {
      logger.error('Register error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password, deviceInfo = {}) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check if account is active
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is not active');
      }

      // Verify password
      const isPasswordValid = await Password.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store session in Redis
      await this.storeSession(user.id, tokens, deviceInfo);

      // Update last login info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIP: deviceInfo.ip,
        },
      });

      logger.info('User logged in successfully', { userId: user.id });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          portfolioUsername: user.portfolioUsername,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId, accessToken) {
    try {
      // Invalidate access token in Redis
      const key = `access_token:${userId}:${accessToken}`;
      await redis.del(key);

      // Delete refresh token
      await redis.del(`refresh_token:${userId}`);

      logger.info('User logged out successfully', { userId });

      return {
        message: 'Logout successful',
      };
    } catch (error) {
      logger.error('Logout error:', error);
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
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is not active');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Store new session
      await this.storeSession(user.id, tokens);

      logger.info('Token refreshed successfully', { userId: user.id });

      return {
        tokens,
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      // Update user as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });

      logger.info('Email verified successfully', { userId: user.id });

      return {
        message: 'Email verified successfully',
      };
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return {
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      // Generate reset token (valid for 1 hour)
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpires,
        },
      });

      // Send password reset email (in background)
      // await this.sendPasswordResetEmail(user, resetToken);

      logger.info('Password reset requested', { userId: user.id });

      return {
        message: 'If the email exists, a password reset link has been sent',
      };
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
      // Validate password strength
      const validation = this.validatePasswordStrength(newPassword);
      if (!validation.valid) {
        throw new BadRequestError('Password does not meet requirements');
      }

      // Hash new password
      const hashedPassword = await Password.hash(newPassword);

      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      logger.info('Password reset successfully', { userId: user.id });

      return {
        message: 'Password reset successfully',
      };
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
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isPasswordValid = await Password.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Validate new password strength
      const validation = this.validatePasswordStrength(newPassword);
      if (!validation.valid) {
        throw new BadRequestError('New password does not meet requirements');
      }

      // Hash new password
      const hashedPassword = await Password.hash(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info('Password changed successfully', { userId });

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const checks = {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const isValid = Object.values(checks).every(Boolean);

    if (!isValid) {
      const feedback = [];
      if (!checks.minLength) feedback.push('Password must be at least 8 characters');
      if (!checks.hasLowercase) feedback.push('Password must contain lowercase letter');
      if (!checks.hasUppercase) feedback.push('Password must contain uppercase letter');
      if (!checks.hasNumber) feedback.push('Password must contain number');
      if (!checks.hasSpecial) feedback.push('Password must contain special character');

      return { valid: false, feedback };
    }

    return { valid: true };
  }

  /**
   * Generate tokens
   */
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      isEmailVerified: user.isEmailVerified,
    };

    const accessToken = Token.generateAccessToken(payload);
    const refreshToken = Token.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  /**
   * Store session in Redis
   */
  async storeSession(userId, tokens, deviceInfo = {}) {
    try {
      const sessionData = {
        userId,
        ...deviceInfo,
        createdAt: new Date().toISOString(),
      };

      // Store access token (15 min TTL)
      const accessKey = `access_token:${userId}:${tokens.accessToken}`;
      await redis.set(
        accessKey,
        JSON.stringify(sessionData),
        config.jwt.accessExpiry || '15m'
      );

      // Store refresh token (7 days TTL)
      const refreshKey = `refresh_token:${userId}`;
      await redis.set(
        refreshKey,
        tokens.refreshToken,
        config.jwt.refreshExpiry || '7d'
      );
    } catch (error) {
      logger.error('Error storing session:', error);
      // Don't throw error - session storage failure shouldn't break login
    }
  }

  /**
   * Social authentication
   */
  async socialAuth({ provider, token, email, firstName, lastName }) {
    try {
      // Check if user exists with this email
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        // Update OAuth info
        const oauthProviders = user.oauthProviders || {};
        oauthProviders[provider] = {
          id: token,
          email,
        };

        user = await prisma.user.update({
          where: { id: user.id },
          data: { oauthProviders },
        });
      } else {
        // Create new user
        const crypto = require('crypto');
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await Password.hash(randomPassword);

        user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            password: hashedPassword,
            isEmailVerified: true, // OAuth emails are pre-verified
            oauthProviders: {
              [provider]: {
                id: token,
                email,
              },
            },
          },
        });
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store session
      await this.storeSession(user.id, tokens);

      logger.info('Social auth successful', {
        userId: user.id,
        provider
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
        },
        tokens,
        requiresVerification: false,
      };
    } catch (error) {
      logger.error('Social auth error:', error);
      throw error;
    }
  }
}

module.exports = new PrismaAuthService();
