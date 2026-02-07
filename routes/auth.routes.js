/**
 * Authentication Routes
 * Handles user authentication, registration, and session management
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');
const { validate } = require('../middlewares/validation.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @rateLimit 3 requests per hour
 */
router.post(
  '/register',
  rateLimit.register,
  validate('authRegister'),
  authController.register
);

/**
 * @route   POST /api/auth/register/social
 * @desc    Register/login via social OAuth
 * @access  Public
 * @rateLimit 10 requests per hour
 */
router.post(
  '/register/social',
  rateLimit.auth,
  validate('authSocial'),
  authController.socialRegister
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post(
  '/login',
  rateLimit.login,
  validate('authLogin'),
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate tokens
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires valid refresh token)
 * @rateLimit 20 requests per hour
 */
router.post(
  '/refresh',
  rateLimit.general,
  validate('authRefresh'),
  authController.refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @rateLimit 3 requests per hour
 */
router.post(
  '/forgot-password',
  rateLimit.passwordReset,
  validate('authForgotPassword'),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public (requires valid reset token)
 * @rateLimit 3 requests per hour
 */
router.post(
  '/reset-password',
  rateLimit.passwordReset,
  validate('authResetPassword'),
  authController.resetPassword
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public (requires valid verification token)
 */
router.post(
  '/verify-email',
  validate('authVerifyEmail'),
  authController.verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 * @rateLimit 5 requests per 24 hours
 */
router.post(
  '/resend-verification',
  authenticate,
  rateLimit.emailVerification,
  authController.resendVerification
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate('authChangePassword'),
  authController.changePassword
);

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Enable two-factor authentication
 * @access  Private
 */
router.post(
  '/2fa/enable',
  authenticate,
  authController.enableTwoFactor
);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable two-factor authentication
 * @access  Private
 */
router.post(
  '/2fa/disable',
  authenticate,
  authController.disableTwoFactor
);

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify two-factor authentication code
 * @access  Private
 */
router.post(
  '/2fa/verify',
  authenticate,
  validate('authVerify2FA'),
  authController.verifyTwoFactor
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  authController.revokeSession
);

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.delete('/sessions', authenticate, authController.revokeAllSessions);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/magic-link
 * @desc    Request magic link for passwordless login
 * @access  Public
 * @rateLimit 5 requests per hour
 */
router.post(
  '/magic-link',
  rateLimit.passwordReset,
  validate('authMagicLink'),
  authController.requestMagicLink
);

/**
 * @route   POST /api/auth/magic-link/verify
 * @desc    Verify magic link token
 * @access  Public
 */
router.post(
  '/magic-link/verify',
  validate('authVerifyMagicLink'),
  authController.verifyMagicLink
);

module.exports = router;
