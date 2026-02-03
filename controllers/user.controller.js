/**
 * User Controller
 * Handles user-related HTTP requests
 */

const userRepository = require('../repositories/user.repository');
const { successResponse } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

class UserController {
  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return successResponse(res, { user }, 'Profile retrieved successfully');
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const updateData = req.body;

    const user = await userRepository.updateProfile(userId, updateData);

    return successResponse(res, { user }, 'Profile updated successfully');
  });

  /**
   * Upload avatar
   */
  uploadAvatar = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // File upload would be handled here
    const avatarUrl = 'https://s3.amazonaws.com/bucket/avatar.jpg';

    const user = await userRepository.updateProfile(userId, { avatar: avatarUrl });

    return successResponse(res, { user, avatarUrl }, 'Avatar uploaded successfully');
  });

  /**
   * Delete avatar
   */
  deleteAvatar = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const user = await userRepository.updateProfile(userId, { avatar: null });

    return successResponse(res, { user }, 'Avatar deleted successfully');
  });

  /**
   * Update preferences
   */
  updatePreferences = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const preferences = req.body;

    const user = await userRepository.updateProfile(userId, {
      preferences,
    });

    return successResponse(res, { user }, 'Preferences updated successfully');
  });

  /**
   * Get usage statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const stats = await userRepository.getUserStats(userId);

    return successResponse(res, stats, 'Usage statistics retrieved successfully');
  });

  /**
   * Delete account
   */
  deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { password, confirmation } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Please type "DELETE" to confirm',
      });
    }

    // Verify password
    const user = await userRepository.findById(userId);
    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Mark account as deleted
    await userRepository.updateProfile(userId, {
      status: 'deleted',
      email: `deleted_${user.email}`,
      portfolioUsername: null,
    });

    return successResponse(res, {}, 'Account deleted successfully');
  });
}

module.exports = new UserController();
