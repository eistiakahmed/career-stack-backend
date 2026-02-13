/**
 * Auth Service Unit Tests
 * Testing authentication business logic
 */

const AuthService = require('../../../services/auth/auth.service');
const UserRepository = require('../../../repositories/user.repository');
const { Password, Token } = require('../../../utils/security');
const { ConflictError, UnauthorizedError, BadRequestError } = require('../../../utils/error');
const redis = require('../../../config/redis.config');

// Mock dependencies
jest.mock('../../../repositories/user.repository');
jest.mock('../../../config/redis.config');
jest.mock('../../../utils/security');

describe('AuthService', () => {
  let authService;
  let mockUser;

  beforeEach(() => {
    authService = new AuthService();

    mockUser = {
      _id: '64f1a2b3c4d5e6f7a8b9c0d1',
      email: 'test@example.com',
      password: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      status: 'active',
      isEmailVerified: false,
      subscriptionTier: 'free',
      comparePassword: jest.fn().mockResolvedValue(true),
      generateEmailVerificationToken: jest.fn().mockReturnValue('verification_token'),
      save: jest.fn().mockResolvedValue(true),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register()', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      UserRepository.emailExists.mockResolvedValue(false);
      UserRepository.createUser.mockResolvedValue(mockUser);
      Password.hash.mockResolvedValue('hashed_password');
      Token.generateAccessToken.mockReturnValue('access_token');
      Token.generateRefreshToken.mockReturnValue('refresh_token');
      redis.set.mockResolvedValue(true);

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(UserRepository.emailExists).toHaveBeenCalledWith(userData.email);
      expect(Password.hash).toHaveBeenCalledWith(userData.password);
    });

    test('should throw ConflictError if email exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      UserRepository.emailExists.mockResolvedValue(true);

      await expect(authService.register(userData)).rejects.toThrow(ConflictError);
      await expect(authService.register(userData)).rejects.toThrow('Email already registered');
    });

    test('should validate password strength', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak', // Too short
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(authService.register(userData)).rejects.toThrow();
    });

    test('should generate email verification token', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      UserRepository.emailExists.mockResolvedValue(false);
      UserRepository.createUser.mockResolvedValue(mockUser);
      Password.hash.mockResolvedValue('hashed_password');
      Token.generateAccessToken.mockReturnValue('access_token');
      Token.generateRefreshToken.mockReturnValue('refresh_token');

      await authService.register(userData);

      expect(mockUser.generateEmailVerificationToken).toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    test('should login valid user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const deviceInfo = {
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
      };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      Token.generateAccessToken.mockReturnValue('access_token');
      Token.generateRefreshToken.mockReturnValue('refresh_token');
      redis.set.mockResolvedValue(true);

      const result = await authService.login(loginData.email, loginData.password, deviceInfo);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
    });

    test('should throw UnauthorizedError for invalid email', async () => {
      UserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('invalid@example.com', 'password')
      ).rejects.toThrow(UnauthorizedError);
    });

    test('should throw UnauthorizedError for invalid password', async () => {
      mockUser.comparePassword.mockResolvedValue(false);
      UserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.login('test@example.com', 'wrong_password')
      ).rejects.toThrow(UnauthorizedError);
    });

    test('should throw UnauthorizedError for inactive account', async () => {
      mockUser.status = 'suspended';
      UserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Account is not active');
    });

    test('should store session in Redis', async () => {
      const deviceInfo = { ip: '127.0.0.1' };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      Token.generateAccessToken.mockReturnValue('access_token');
      Token.generateRefreshToken.mockReturnValue('refresh_token');
      redis.set.mockResolvedValue(true);

      await authService.login('test@example.com', 'password', deviceInfo);

      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('logout()', () => {
    test('should logout user successfully', async () => {
      redis.del.mockResolvedValue(true);

      const result = await authService.logout(mockUser._id, 'access_token');

      expect(result).toHaveProperty('message');
      expect(redis.del).toHaveBeenCalled();
    });

    test('should invalidate access token', async () => {
      redis.del.mockResolvedValue(true);

      await authService.logout(mockUser._id, 'access_token');

      expect(redis.del).toHaveBeenCalledWith(
        `access_token:${mockUser._id}:access_token`
      );
    });
  });

  describe('refreshToken()', () => {
    test('should generate new access token', async () => {
      const tokens = {
        accessToken: 'new_access_token',
        refreshToken: 'refresh_token',
      };

      Token.verifyRefreshToken.mockResolvedValue({ userId: mockUser._id });
      UserRepository.findById.mockResolvedValue(mockUser);
      Token.generateAccessToken.mockReturnValue('new_access_token');

      const result = await authService.refreshToken('refresh_token');

      expect(result.tokens).toBeDefined();
      expect(Token.verifyRefreshToken).toHaveBeenCalledWith('refresh_token');
    });

    test('should throw UnauthorizedError for invalid refresh token', async () => {
      Token.verifyRefreshToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        authService.refreshToken('invalid_token')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('verifyEmail()', () => {
    test('should verify email with valid token', async () => {
      mockUser.emailVerificationToken = 'valid_token';
      mockUser.emailVerificationExpires = new Date(Date.now() + 3600000);

      UserRepository.findByVerificationToken.mockResolvedValue(mockUser);
      mockUser.save.mockResolvedValue(true);

      const result = await authService.verifyEmail('valid_token');

      expect(result).toHaveProperty('message');
      expect(mockUser.isEmailVerified).toBe(true);
    });

    test('should throw BadRequestError for invalid token', async () => {
      UserRepository.findByVerificationToken.mockResolvedValue(null);

      await expect(
        authService.verifyEmail('invalid_token')
      ).rejects.toThrow(BadRequestError);
    });

    test('should throw BadRequestError for expired token', async () => {
      mockUser.emailVerificationExpires = new Date(Date.now() - 3600000);

      UserRepository.findByVerificationToken.mockResolvedValue(mockUser);

      await expect(
        authService.verifyEmail('expired_token')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('forgotPassword()', () => {
    test('should generate password reset token', async () => {
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUser.generatePasswordResetToken.mockReturnValue('reset_token');
      mockUser.save.mockResolvedValue(true);

      const result = await authService.forgotPassword('test@example.com');

      expect(result).toHaveProperty('message');
      expect(mockUser.generatePasswordResetToken).toHaveBeenCalled();
    });

    test('should not reveal if email exists', async () => {
      UserRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.forgotPassword('nonexistent@example.com');

      expect(result).toHaveProperty('message');
      // Should return same message even if user doesn't exist
    });
  });

  describe('resetPassword()', () => {
    test('should reset password with valid token', async () => {
      mockUser.resetPasswordToken = 'valid_token';
      mockUser.resetPasswordExpires = new Date(Date.now() + 3600000);

      UserRepository.findByResetToken.mockResolvedValue(mockUser);
      Password.hash.mockResolvedValue('new_hashed_password');
      mockUser.save.mockResolvedValue(true);

      const result = await authService.resetPassword('valid_token', 'NewPassword123!');

      expect(result).toHaveProperty('message');
      expect(Password.hash).toHaveBeenCalledWith('NewPassword123!');
    });

    test('should throw BadRequestError for invalid token', async () => {
      UserRepository.findByResetToken.mockResolvedValue(null);

      await expect(
        authService.resetPassword('invalid_token', 'NewPassword123!')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('changePassword()', () => {
    test('should change password with correct current password', async () => {
      UserRepository.findById.mockResolvedValue(mockUser);
      Password.hash.mockResolvedValue('new_hashed_password');
      mockUser.save.mockResolvedValue(true);

      const result = await authService.changePassword(
        mockUser._id,
        'CurrentPass123!',
        'NewPassword123!'
      );

      expect(result).toHaveProperty('message');
      expect(mockUser.comparePassword).toHaveBeenCalled();
    });

    test('should throw UnauthorizedError for incorrect current password', async () => {
      mockUser.comparePassword.mockResolvedValue(false);
      UserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        authService.changePassword(
          mockUser._id,
          'WrongPassword',
          'NewPassword123!'
        )
      ).rejects.toThrow(UnauthorizedError);
    });

    test('should validate new password strength', async () => {
      UserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        authService.changePassword(
          mockUser._id,
          'CurrentPass123!',
          'weak'
        )
      ).rejects.toThrow();
    });
  });

  describe('validatePasswordStrength()', () => {
    test('should validate strong password', () => {
      const result = authService.validatePasswordStrength('StrongPass123!');

      expect(result.valid).toBe(true);
    });

    test('should reject weak password', () => {
      const result = authService.validatePasswordStrength('weak');

      expect(result.valid).toBe(false);
      expect(result.feedback).toBeDefined();
    });

    test('should reject password without numbers', () => {
      const result = authService.validatePasswordStrength('NoNumbers!');

      expect(result.valid).toBe(false);
    });

    test('should reject password without special characters', () => {
      const result = authService.validatePasswordStrength('NoSpecialChars123');

      expect(result.valid).toBe(false);
    });
  });

  describe('generateTokens()', () => {
    test('should generate access and refresh tokens', () => {
      Token.generateAccessToken.mockReturnValue('access_token');
      Token.generateRefreshToken.mockReturnValue('refresh_token');

      const tokens = authService.generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
    });
  });

  describe('storeSession()', () => {
    test('should store session in Redis', async () => {
      const tokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };

      redis.set.mockResolvedValue(true);

      await authService.storeSession(mockUser._id, tokens);

      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('socialAuth()', () => {
    test('should create new user via social auth', async () => {
      const socialData = {
        provider: 'google',
        token: 'google_token',
        email: 'social@example.com',
        firstName: 'Social',
        lastName: 'User',
      };

      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.createUser.mockResolvedValue(mockUser);
      Token.generateAccessToken.mockReturnValue('access_token');
      Token.generateRefreshToken.mockReturnValue('refresh_token');
      redis.set.mockResolvedValue(true);

      const result = await authService.socialAuth(socialData);

      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(socialData.email);
    });

    test('should login existing user via social auth', async () => {
      const socialData = {
        provider: 'google',
        token: 'google_token',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      Token.generateAccessToken.mockReturnValue('access_token');
      Token.generateRefreshToken.mockReturnValue('refresh_token');
      redis.set.mockResolvedValue(true);

      const result = await authService.socialAuth(socialData);

      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(socialData.email);
    });
  });
});
