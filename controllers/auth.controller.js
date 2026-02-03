/**
 * Authentication Controller
 * Handles authentication HTTP requests
 */

const authService = require('../services/auth/auth.service');
const { successResponse } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const { extractIP, parseUserAgent } = require('../utils/helpers');

class AuthController {
  /**
   * Register new user
   */
  register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.feedback,
      });
    }

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
    });

    return successResponse(res, result, 'Registration successful', 201);
  });

  /**
   * Social OAuth registration/login
   */
  socialRegister = asyncHandler(async (req, res) => {
    const { provider, token, email, firstName, lastName } = req.body;

    const result = await authService.socialAuth({
      provider,
      token,
      email,
      firstName,
      lastName,
    });

    return successResponse(res, result, 'Social authentication successful');
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Get device info
    const deviceInfo = {
      ip: extractIP(req),
      userAgent: req.headers['user-agent'],
      ...parseUserAgent(req.headers['user-agent']),
    };

    const result = await authService.login(email, password, deviceInfo);

    return successResponse(res, result, 'Login successful');
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const accessToken = extractToken(req);

    const result = await authService.logout(userId, accessToken);

    return successResponse(res, result, 'Logout successful');
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    return successResponse(res, { tokens }, 'Token refreshed successfully');
  });

  /**
   * Verify email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    const result = await authService.verifyEmail(token);

    return successResponse(res, result, 'Email verified successfully');
  });

  /**
   * Request password reset
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    return successResponse(
      res,
      result,
      'If email exists, password reset instructions have been sent'
    );
  });

  /**
   * Reset password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.feedback,
      });
    }

    const result = await authService.resetPassword(token, newPassword);

    return successResponse(res, result, 'Password reset successful');
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.feedback,
      });
    }

    const result = await authService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    return successResponse(res, result, 'Password changed successfully');
  });

  /**
   * Get current user
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;

    return successResponse(res, { user }, 'User retrieved successfully');
  });

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Implementation would go here
    return successResponse(res, {}, 'Two-factor authentication enabled');
  });

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Implementation would go here
    return successResponse(res, {}, 'Two-factor authentication disabled');
  });

  /**
   * Verify two-factor authentication code
   */
  verifyTwoFactor = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { code } = req.body;

    // Implementation would go here
    return successResponse(res, {}, 'Two-factor authentication verified');
  });

  /**
   * Get all sessions for user
   */
  getSessions = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Get sessions from Redis
    const redis = require('../config/redis.config');
    const session = await redis.cacheGet(`session:${userId}`);

    const sessions = session ? [session] : [];

    return successResponse(res, { sessions }, 'Sessions retrieved successfully');
  });

  /**
   * Revoke a specific session
   */
  revokeSession = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    // Implementation would go here
    return successResponse(res, {}, 'Session revoked successfully');
  });

  /**
   * Revoke all sessions except current
   */
  revokeAllSessions = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    await authService.invalidateAllSessions(userId);

    return successResponse(res, {}, 'All sessions revoked successfully');
  });

  /**
   * Resend verification email
   */
  resendVerification = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Implementation would go here
    return successResponse(res, {}, 'Verification email sent');
  });

  /**
   * Request magic link
   */
  requestMagicLink = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Implementation would go here
    return successResponse(
      res,
      {},
      'If email exists, magic link has been sent'
    );
  });

  /**
   * Verify magic link
   */
  verifyMagicLink = asyncHandler(async (req, res) => {
    const { token } = req.body;

    // Implementation would go here
    return successResponse(res, {}, 'Magic link verified');
  });
}

/**
 * Extract token from request
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

module.exports = new AuthController();
