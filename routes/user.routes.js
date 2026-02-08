/**
 * User Routes
 * User profile and settings endpoints
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');

/**
 * @route   GET /users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, userController.getProfile);

/**
 * @route   PUT /users/me
 * @desc    Update user profile
 * @access  Private
 */
router.put('/me', authenticate, validate('userUpdate'), userController.updateProfile);

/**
 * @route   POST /users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/avatar', authenticate, rateLimit.upload, userController.uploadAvatar);

/**
 * @route   DELETE /users/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete('/avatar', authenticate, userController.deleteAvatar);

/**
 * @route   PUT /users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', authenticate, userController.updatePreferences);

/**
 * @route   GET /users/stats
 * @desc    Get user usage statistics
 * @access  Private
 */
router.get('/stats', authenticate, userController.getStats);

/**
 * @route   DELETE /users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticate, userController.deleteAccount);

module.exports = router;
