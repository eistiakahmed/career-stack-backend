/**
 * User Repository
 * Data access layer for User model
 */

const BaseRepository = require('./base.repository');
const User = require('../models/user.model');
const { NotFoundError } = require('../utils/error');
const logger = require('../utils/logger');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      return await this.model.findByEmail(email);
    } catch (error) {
      logger.error('Find by email error:', error);
      throw error;
    }
  }

  /**
   * Find user by email or portfolio username
   */
  async findByEmailOrUsername(identifier) {
    try {
      return await this.model.findByEmailOrUsername(identifier);
    } catch (error) {
      logger.error('Find by email or username error:', error);
      throw error;
    }
  }

  /**
   * Find user by portfolio username
   */
  async findByPortfolioUsername(username) {
    try {
      return await this.model.findOne({
        portfolioUsername: username.toLowerCase(),
        status: 'active',
      });
    } catch (error) {
      logger.error('Find by portfolio username error:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    try {
      return await this.exists({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Email exists check error:', error);
      throw error;
    }
  }

  /**
   * Check if portfolio username exists
   */
  async portfolioUsernameExists(username) {
    try {
      return await this.exists({
        portfolioUsername: username.toLowerCase(),
      });
    } catch (error) {
      logger.error('Portfolio username exists check error:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      // Check if email already exists
      const existingUser = await this.emailExists(userData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      return await this.create(userData);
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    try {
      // Remove fields that shouldn't be updated directly
      const safeUpdate = { ...updateData };
      delete safeUpdate.email;
      delete safeUpdate.password;
      delete safeUpdate.role;
      delete safeUpdate.subscriptionTier;
      delete safeUpdate._id;

      return await this.update(userId, safeUpdate);
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, newPassword) {
    try {
      return await this.update(userId, { password: newPassword });
    } catch (error) {
      logger.error('Update password error:', error);
      throw error;
    }
  }

  /**
   * Update user email
   */
  async updateEmail(userId, newEmail) {
    try {
      // Check if new email already exists
      const existingUser = await this.emailExists(newEmail);
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error('Email already in use');
      }

      return await this.update(userId, {
        email: newEmail,
        isEmailVerified: false,
      });
    } catch (error) {
      logger.error('Update email error:', error);
      throw error;
    }
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId) {
    try {
      return await this.update(userId, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
      });
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save();

      return { user, resetToken };
    } catch (error) {
      logger.error('Set password reset token error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(userId, newPassword) {
    try {
      return await this.update(userId, {
        password: newPassword,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Update subscription tier
   */
  async updateSubscriptionTier(userId, tier, status = 'active') {
    try {
      return await this.update(userId, {
        subscriptionTier: tier,
        subscriptionStatus: status,
      });
    } catch (error) {
      logger.error('Update subscription tier error:', error);
      throw error;
    }
  }

  /**
   * Update usage stats
   */
  async incrementUsage(userId, type) {
    try {
      const updateField = `usage.${type}`;
      return await this.model.findByIdAndUpdate(
        userId,
        { $inc: { [updateField]: 1 } },
        { new: true }
      );
    } catch (error) {
      logger.error('Increment usage error:', error);
      throw error;
    }
  }

  /**
   * Update login info
   */
  async updateLoginInfo(userId, ip) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.updateLoginInfo(ip);
      return user;
    } catch (error) {
      logger.error('Update login info error:', error);
      throw error;
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const secret = user.generateTwoFactorSecret();
      await user.save();

      return { user, secret };
    } catch (error) {
      logger.error('Enable two-factor error:', error);
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(userId) {
    try {
      return await this.update(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
      });
    } catch (error) {
      logger.error('Disable two-factor error:', error);
      throw error;
    }
  }

  /**
   * Verify two-factor token
   */
  async verifyTwoFactor(userId, token) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isValid = user.verifyTwoFactorToken(token);
      if (!isValid) {
        throw new Error('Invalid two-factor token');
      }

      return user;
    } catch (error) {
      logger.error('Verify two-factor error:', error);
      throw error;
    }
  }

  /**
   * Set portfolio username
   */
  async setPortfolioUsername(userId, username) {
    try {
      // Check if username is already taken
      const existingUser = await this.portfolioUsernameExists(username);
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error('Portfolio username already taken');
      }

      return await this.update(userId, {
        portfolioUsername: username.toLowerCase(),
        portfolioEnabled: true,
      });
    } catch (error) {
      logger.error('Set portfolio username error:', error);
      throw error;
    }
  }

  /**
   * Get users by subscription tier
   */
  async getUsersByTier(tier, options = {}) {
    try {
      return await this.findAll(
        { subscriptionTier: tier, status: 'active' },
        options
      );
    } catch (error) {
      logger.error('Get users by tier error:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async search(query, options = {}) {
    try {
      const searchQuery = {
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } },
        ],
        status: { $ne: 'deleted' },
      };

      return await this.paginate(searchQuery, options);
    } catch (error) {
      logger.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Get user stats
   */
  async getUserStats(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user.getUsageStats();
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId) {
    try {
      return await this.update(userId, {
        status: 'inactive',
      });
    } catch (error) {
      logger.error('Deactivate user error:', error);
      throw error;
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(userId) {
    try {
      return await this.update(userId, {
        status: 'suspended',
      });
    } catch (error) {
      logger.error('Suspend user error:', error);
      throw error;
    }
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount() {
    try {
      return await this.model.getActiveUsersCount();
    } catch (error) {
      logger.error('Get active users count error:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository();
