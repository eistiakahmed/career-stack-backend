/**
 * Prisma User Repository
 * User data access layer using Prisma ORM
 */

const { prisma } = require('../../config/prisma.config');
const { ConflictError, NotFoundError } = require('../../utils/error');
const logger = require('../../utils/logger');

class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      return user;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(email, username) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { portfolioUsername: username },
          ],
        },
      });

      return user;
    } catch (error) {
      logger.error('Error finding user by email/username:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      return user;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    try {
      const count = await prisma.user.count({
        where: { email },
      });

      return count > 0;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }

  /**
   * Check if portfolio username exists
   */
  async portfolioUsernameExists(username) {
    try {
      const count = await prisma.user.count({
        where: { portfolioUsername: username },
      });

      return count > 0;
    } catch (error) {
      logger.error('Error checking portfolio username:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      const user = await prisma.user.create({
        data: userData,
      });

      logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictError('Email already registered');
      }
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      logger.info('User profile updated', { userId });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, hashedPassword) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info('User password updated', { userId });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });

      logger.info('User email verified', { userId });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(userId, token, expiresAt) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expiresAt,
        },
      });

      logger.info('Password reset token set', { userId });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      logger.error('Error setting password reset token:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, hashedPassword) {
    try {
      const user = await prisma.user.updateMany({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { gt: new Date() },
        },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      if (user.count === 0) {
        throw new NotFoundError('Invalid or expired reset token');
      }

      logger.info('Password reset successful');
      return user;
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Update login info
   */
  async updateLoginInfo(userId, deviceInfo) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          lastLoginIP: deviceInfo.ip,
        },
      });

      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      logger.error('Error updating login info:', error);
      throw error;
    }
  }

  /**
   * Find users with pagination
   */
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, status, role } = options;
      const skip = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            subscriptionTier: true,
            isEmailVerified: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding users:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info('User deleted', { userId });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Update AI credits
   */
  async incrementAIUsage(userId) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          aiCreditsUsed: { increment: 1 },
        },
      });

      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      logger.error('Error incrementing AI usage:', error);
      throw error;
    }
  }

  /**
   * Update subscription tier
   */
  async updateSubscriptionTier(userId, tier) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: tier },
      });

      logger.info('User subscription tier updated', { userId, tier });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      logger.error('Error updating subscription tier:', error);
      throw error;
    }
  }

  /**
   * Count users by status
   */
  async countByStatus(status) {
    try {
      const count = await prisma.user.count({
        where: { status },
      });

      return count;
    } catch (error) {
      logger.error('Error counting users by status:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getStats(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          resumesCreated: true,
          aiCreditsUsed: true,
          subscriptionTier: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository();
