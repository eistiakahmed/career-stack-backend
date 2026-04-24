/**
 * Auth Controller Unit Tests
 * Testing authentication HTTP request handlers
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../../services/auth/auth.service');
jest.mock('../../../utils/logger');

const AuthController = require('../../../controllers/auth.controller');
const { successResponse } = require('../../../utils/response');

describe('Auth Controller', () => {
  let app;
  let authController;
  let mockAuthService;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Create controller instance
    authController = require('../../../controllers/auth.controller');

    // Create mock auth service
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      verifyEmail: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      validatePasswordStrength: jest.fn(),
      generateTokens: jest.fn(),
      socialAuth: jest.fn(),
    };

    // Mock the service module
    const authService = require('../../../services/auth/auth.service');
    Object.assign(authService, mockAuthService);

    // Setup routes
    app.post('/auth/register', (req, res, next) => {
      authController.register(req, res, next);
    });

    app.post('/auth/login', (req, res, next) => {
      authController.login(req, res, next);
    });

    app.post('/auth/logout', (req, res, next) => {
      req.user = { userId: '64f1a2b3c4d5e6f7a8b9c0d1' };
      authController.logout(req, res, next);
    });

    app.post('/auth/refresh', (req, res, next) => {
      authController.refreshToken(req, res, next);
    });

    app.post('/auth/verify-email', (req, res, next) => {
      authController.verifyEmail(req, res, next);
    });

    app.post('/auth/forgot-password', (req, res, next) => {
      authController.forgotPassword(req, res, next);
    });

    app.post('/auth/reset-password', (req, res, next) => {
      authController.resetPassword(req, res, next);
    });

    app.post('/auth/change-password', (req, res, next) => {
      req.user = { userId: '64f1a2b3c4d5e6f7a8b9c0d1' };
      authController.changePassword(req, res, next);
    });

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockResponse = {
        user: {
          id: '64f1a2b3c4d5e6f7a8b9c0d1',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
        tokens: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        },
      };

      mockAuthService.register.mockResolvedValue(mockResponse);
      mockAuthService.validatePasswordStrength.mockReturnValue({
        valid: true,
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
    });

    test('should return 400 for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthService.validatePasswordStrength.mockReturnValue({
        valid: false,
        feedback: ['Password is too weak'],
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    test('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 409 for existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthService.register.mockRejectedValue(
        new Error('Email already registered')
      );
      mockAuthService.validatePasswordStrength.mockReturnValue({
        valid: true,
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    test('should login valid user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockResponse = {
        user: {
          id: '64f1a2b3c4d5e6f7a8b9c0d1',
          email: loginData.email,
        },
        tokens: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
        expect.any(Object)
      );
    });

    test('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong_password',
      };

      mockAuthService.login.mockRejectedValue(
        new Error('Invalid credentials')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 400 for missing email', async () => {
      const loginData = {
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout authenticated user', async () => {
      mockAuthService.logout.mockResolvedValue({
        message: 'Logout successful',
      });

      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    test('should refresh access token', async () => {
      const refreshToken = 'valid_refresh_token';

      const mockResponse = {
        tokens: {
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token',
        },
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    test('should return 401 for invalid refresh token', async () => {
      mockAuthService.refreshToken.mockRejectedValue(
        new Error('Invalid refresh token')
      );

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/verify-email', () => {
    test('should verify email with valid token', async () => {
      const token = 'valid_verification_token';

      mockAuthService.verifyEmail.mockResolvedValue({
        message: 'Email verified successfully',
      });

      const response = await request(app)
        .post('/auth/verify-email')
        .send({ token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });

    test('should return 400 for invalid token', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(
        new Error('Invalid verification token')
      );

      const response = await request(app)
        .post('/auth/verify-email')
        .send({ token: 'invalid_token' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/forgot-password', () => {
    test('should send password reset email', async () => {
      const email = 'test@example.com';

      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'Password reset email sent',
      });

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(email);
    });

    test('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/reset-password', () => {
    test('should reset password with valid token', async () => {
      const resetData = {
        token: 'valid_reset_token',
        newPassword: 'NewPassword123!',
      };

      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Password reset successful',
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetData.token,
        resetData.newPassword
      );
    });

    test('should validate new password strength', async () => {
      const resetData = {
        token: 'valid_reset_token',
        newPassword: 'weak',
      };

      const response = await request(app)
        .post('/auth/reset-password')
        .send(resetData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/change-password', () => {
    test('should change password with correct current password', async () => {
      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewPassword123!',
      };

      mockAuthService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const response = await request(app)
        .post('/auth/change-password')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        '64f1a2b3c4d5e6f7a8b9c0d1',
        passwordData.currentPassword,
        passwordData.newPassword
      );
    });

    test('should return 401 for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123!',
      };

      mockAuthService.changePassword.mockRejectedValue(
        new Error('Incorrect password')
      );

      const response = await request(app)
        .post('/auth/change-password')
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    test('should validate email format on registration', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate password min length', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Short1!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require first name on registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require last name on registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security', () => {
    test('should not expose password in response', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthService.register.mockResolvedValue({
        user: {
          id: '64f1a2b3c4d5e6f7a8b9c0d1',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
        tokens: {
          accessToken: 'access_token',
        },
      });

      mockAuthService.validatePasswordStrength.mockReturnValue({
        valid: true,
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should include tokens in response', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthService.register.mockResolvedValue({
        user: {
          id: '64f1a2b3c4d5e6f7a8b9c0d1',
          email: userData.email,
        },
        tokens: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        },
      });

      mockAuthService.validatePasswordStrength.mockReturnValue({
        valid: true,
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });
  });
});
