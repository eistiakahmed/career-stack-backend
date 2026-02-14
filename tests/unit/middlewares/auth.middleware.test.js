/**
 * Auth Middleware Unit Tests
 * Testing authentication and authorization middleware
 */

const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../../utils/logger');
jest.mock('../../../config/redis.config');

const { authenticate } = require('../../../middlewares/auth.middleware');
const { UnauthorizedError, ForbiddenError } = require('../../../utils/error');
const redis = require('../../../config/redis.config');

describe('Auth Middleware', () => {
  let app;
  let mockToken;
  let mockUser;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Setup mock data
    mockUser = {
      userId: '64f1a2b3c4d5e6f7a8b9c0d1',
      email: 'test@example.com',
      role: 'user',
    };

    mockToken = jwt.sign(mockUser, 'test-secret-key-min-32-chars-long', {
      expiresIn: '15m',
    });

    // Mock Redis
    redis.get = jest.fn().mockResolvedValue(null);
    redis.set = jest.fn().mockResolvedValue(true);
    redis.del = jest.fn().mockResolvedValue(true);

    // Setup routes
    app.get('/protected', authenticate, (req, res) => {
      res.json({
        success: true,
        user: req.user,
      });
    });

    app.get('/optional', authenticate.optionalAuth, (req, res) => {
      res.json({
        success: true,
        user: req.user || null,
      });
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

  describe('authenticate()', () => {
    test('should authenticate user with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBe(mockUser.userId);
    });

    test('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(mockUser, 'test-secret-key-min-32-chars-long', {
        expiresIn: '-1h',
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 for blacklisted token', async () => {
      redis.get.mockResolvedValue('blacklisted');

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed Authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle token without Bearer prefix', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', mockToken)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('optionalAuth()', () => {
    test('should pass request without token', async () => {
      const response = await request(app)
        .get('/optional')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeNull();
    });

    test('should authenticate user with valid token', async () => {
      const response = await request(app)
        .get('/optional')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toBe(mockUser.userId);
    });

    test('should not fail with invalid token', async () => {
      const response = await request(app)
        .get('/optional')
        .set('Authorization', 'Bearer invalid_token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeNull();
    });
  });

  describe('verifyRefreshToken()', () => {
    let appWithRefresh;

    beforeEach(() => {
      appWithRefresh = express();
      appWithRefresh.use(express.json());

      appWithRefresh.post('/refresh', (req, res, next) => {
        const middleware = require('../../../middlewares/auth.middleware');
        middleware.verifyRefreshToken(req, res, next);
      }, (req, res) => {
        res.json({
          success: true,
          userId: req.userId,
        });
      });

      appWithRefresh.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
        });
      });
    });

    test('should verify valid refresh token', async () => {
      const refreshToken = jwt.sign(
        { type: 'refresh', userId: mockUser.userId },
        'test-refresh-secret-key-min-32-chars',
        { expiresIn: '7d' }
      );

      const response = await request(appWithRefresh)
        .post('/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe(mockUser.userId);
    });

    test('should reject invalid refresh token', async () => {
      const response = await request(appWithRefresh)
        .post('/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject access token as refresh token', async () => {
      const response = await request(appWithRefresh)
        .post('/refresh')
        .send({ refreshToken: mockToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('requireVerifiedEmail()', () => {
    let appWithVerification;

    beforeEach(() => {
      appWithVerification = express();
      appWithVerification.use(express.json());

      appWithVerification.get('/verified', authenticate, (req, res, next) => {
        const middleware = require('../../../middlewares/auth.middleware');
        middleware.requireVerifiedEmail(req, res, next);
      }, (req, res) => {
        res.json({ success: true });
      });

      appWithVerification.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
        });
      });
    });

    test('should pass for verified email', async () => {
      const verifiedToken = jwt.sign(
        { ...mockUser, isEmailVerified: true },
        'test-secret-key-min-32-chars-long',
        { expiresIn: '15m' }
      );

      const response = await request(appWithVerification)
        .get('/verified')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should fail for unverified email', async () => {
      const unverifiedToken = jwt.sign(
        { ...mockUser, isEmailVerified: false },
        'test-secret-key-min-32-chars-long',
        { expiresIn: '15m' }
      );

      const response = await request(appWithVerification)
        .get('/verified')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('verify');
    });
  });

  describe('requireSubscription()', () => {
    let appWithSubscription;

    beforeEach(() => {
      appWithSubscription = express();
      appWithSubscription.use(express.json());

      appWithSubscription.get('/premium', authenticate, (req, res, next) => {
        const middleware = require('../../../middlewares/auth.middleware');
        middleware.requireSubscription('premium')(req, res, next);
      }, (req, res) => {
        res.json({ success: true });
      });

      appWithSubscription.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
        });
      });
    });

    test('should pass for premium user', async () => {
      const premiumToken = jwt.sign(
        { ...mockUser, subscriptionTier: 'premium' },
        'test-secret-key-min-32-chars-long',
        { expiresIn: '15m' }
      );

      const response = await request(appWithSubscription)
        .get('/premium')
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should fail for free user', async () => {
      const freeToken = jwt.sign(
        { ...mockUser, subscriptionTier: 'free' },
        'test-secret-key-min-32-chars-long',
        { expiresIn: '15m' }
      );

      const response = await request(appWithSubscription)
        .get('/premium')
        .set('Authorization', `Bearer ${freeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('subscription');
    });
  });

  describe('ownsResource()', () => {
    let appWithOwnership;

    beforeEach(() => {
      appWithOwnership = express();
      appWithOwnership.use(express.json());

      appWithOwnership.get('/resource/:resourceId', authenticate, (req, res, next) => {
        const middleware = require('../../../middlewares/auth.middleware');
        middleware.ownsResource((req) => req.params.resourceId)(req, res, next);
      }, (req, res) => {
        res.json({ success: true });
      });

      appWithOwnership.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
        });
      });
    });

    test('should pass for admin user', async () => {
      const adminToken = jwt.sign(
        { ...mockUser, role: 'admin' },
        'test-secret-key-min-32-chars-long',
        { expiresIn: '15m' }
      );

      const response = await request(appWithOwnership)
        .get('/resource/different-resource-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should pass for resource owner', async () => {
      const userToken = jwt.sign(
        { ...mockUser, role: 'user' },
        'test-secret-key-min-32-chars-long',
        { expiresIn: '15m' }
      );

      const response = await request(appWithOwnership)
        .get(`/resource/${mockUser.userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should fail for non-owner', async () => {
      const userToken = jwt.sign(
        { ...mockUser, role: 'user' },
        'test-secret-key-min-32-chars-long',
        { expiresIn: '15m' }
      );

      const response = await request(appWithOwnership)
        .get('/resource/different-resource-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Token Extraction', () => {
    test('should extract token from Authorization header', () => {
      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      };

      const middleware = require('../../../middlewares/auth.middleware');
      const extracted = middleware.extractToken(req);

      expect(extracted).toBe(mockToken);
    });

    test('should return null for missing header', () => {
      const req = {
        headers: {},
      };

      const middleware = require('../../../middlewares/auth.middleware');
      const extracted = middleware.extractToken(req);

      expect(extracted).toBeNull();
    });

    test('should return null for malformed header', () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat',
        },
      };

      const middleware = require('../../../middlewares/auth.middleware');
      const extracted = middleware.extractToken(req);

      expect(extracted).toBeNull();
    });
  });

  describe('Security', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/protected')
          .set('Authorization', `Bearer ${mockToken}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should handle token with malicious payload', async () => {
      const maliciousToken = jwt.sign(
        { ...mockUser, role: 'admin' }, // Attempting privilege escalation
        'test-secret-key-min-32-chars-long',
        { expiresIn: '15m' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${maliciousToken}`)
        .expect(200);

      // Token should be verified, but role should come from database
      expect(response.body.success).toBe(true);
    });
  });
});
