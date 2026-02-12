/**
 * User Model Unit Tests
 * Testing User schema validation, methods, and statics
 */

const User = require('../../../models/user.model');
const { Password, Token } = require('../../../utils/security');

describe('User Model', () => {
  let userData;

  beforeEach(() => {
    userData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
    };
  });

  describe('Schema Validation', () => {
    test('should create valid user', async () => {
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.password).not.toBe(userData.password); // Hashed
    });

    test('should require email', async () => {
      const user = new User({ ...userData, email: '' });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require valid email format', async () => {
      const user = new User({ ...userData, email: 'invalid-email' });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require password', async () => {
      const user = new User({ ...userData, password: '' });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require password min length 8', async () => {
      const user = new User({ ...userData, password: 'Short1!' });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require first name', async () => {
      const user = new User({ ...userData, firstName: '' });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require last name', async () => {
      const user = new User({ ...userData, lastName: '' });

      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      await User.create(userData);

      const duplicateUser = new User(userData);
      await expect(duplicateUser.save()).rejects.toThrow();
    });

    test('should set default role to user', async () => {
      const user = new User(userData);
      await user.save();

      expect(user.role).toBe('user');
    });

    test('should set default status to active', async () => {
      const user = new User(userData);
      await user.save();

      expect(user.status).toBe('active');
    });

    test('should set default subscription tier to free', async () => {
      const user = new User(userData);
      await user.save();

      expect(user.subscriptionTier).toBe('free');
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create(userData);
    });

    describe('comparePassword()', () => {
      test('should return true for correct password', async () => {
        const isValid = await user.comparePassword(userData.password);

        expect(isValid).toBe(true);
      });

      test('should return false for incorrect password', async () => {
        const isValid = await user.comparePassword('WrongPassword123!');

        expect(isValid).toBe(false);
      });
    });

    describe('generateEmailVerificationToken()', () => {
      test('should generate email verification token', async () => {
        const token = user.generateEmailVerificationToken();

        expect(token).toBeDefined();
        expect(user.emailVerificationToken).toBeDefined();
        expect(user.emailVerificationExpires).toBeDefined();
      });
    });

    describe('generatePasswordResetToken()', () => {
      test('should generate password reset token', async () => {
        const token = user.generatePasswordResetToken();

        expect(token).toBeDefined();
        expect(user.resetPasswordToken).toBeDefined();
        expect(user.resetPasswordExpires).toBeDefined();
      });
    });

    describe('updateLoginInfo()', () => {
      test('should update last login', async () => {
        const deviceInfo = {
          ip: '127.0.0.1',
          userAgent: 'Test Agent'
        };

        user.updateLoginInfo(deviceInfo);
        await user.save();

        expect(user.lastLoginAt).toBeDefined();
        expect(user.lastLoginIP).toBe(deviceInfo.ip);
      });
    });

    describe('isPremium()', () => {
      test('should return false for free users', () => {
        expect(user.isPremium()).toBe(false);
      });

      test('should return true for premium users', async () => {
        user.subscriptionTier = 'premium';
        await user.save();

        expect(user.isPremium()).toBe(true);
      });
    });

    describe('canUseAI()', () => {
      test('should check AI usage limits', async () => {
        user.aiCreditsUsed = 0;

        expect(user.canUseAI()).toBe(true);

        user.aiCreditsUsed = 100;
        expect(user.canUseAI()).toBe(false);
      });
    });

    describe('incrementAIUsage()', () => {
      test('should increment AI credits used', async () => {
        const initial = user.aiCreditsUsed;

        user.incrementAIUsage();
        await user.save();

        expect(user.aiCreditsUsed).toBe(initial + 1);
      });
    });

    describe('toJSON()', () => {
      test('should not expose sensitive fields', () => {
        const json = user.toJSON();

        expect(json.password).toBeUndefined();
        expect(json.resetPasswordToken).toBeUndefined();
        expect(json.emailVerificationToken).toBeUndefined();
      });

      test('should include safe fields', () => {
        const json = user.toJSON();

        expect(json._id).toBeDefined();
        expect(json.email).toBeDefined();
        expect(json.firstName).toBeDefined();
      });
    });
  });

  describe('Virtual Fields', () => {
    let user;

    beforeEach(async () => {
      user = await User.create(userData);
    });

    test('should calculate fullName', () => {
      expect(user.fullName).toBe('John Doe');
    });

    test('should check hasActiveSubscription', () => {
      expect(user.hasActiveSubscription).toBe(false);
    });
  });

  describe('Static Methods', () => {
    describe('findByEmail()', () => {
      test('should find user by email', async () => {
        await User.create(userData);

        const found = await User.findByEmail(userData.email);

        expect(found).toBeDefined();
        expect(found.email).toBe(userData.email);
      });

      test('should return null for non-existent email', async () => {
        const found = await User.findByEmail('nonexistent@example.com');

        expect(found).toBeNull();
      });
    });

    describe('emailExists()', () => {
      test('should return true if email exists', async () => {
        await User.create(userData);

        const exists = await User.emailExists(userData.email);

        expect(exists).toBe(true);
      });

      test('should return false if email does not exist', async () => {
        const exists = await User.emailExists('nonexistent@example.com');

        expect(exists).toBe(false);
      });
    });
  });

  describe('Indexes', () => {
    test('should have email index', async () => {
      const indexes = await User.collection.getIndexes();

      expect(indexes).toHaveProperty('email_1');
    });

    test('should have portfolioUsername index', async () => {
      const indexes = await User.collection.getIndexes();

      expect(indexes).toHaveProperty('portfolioUsername_1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long names', async () => {
      const longName = 'A'.repeat(100);

      const user = new User({
        ...userData,
        firstName: longName
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should handle special characters in email', async () => {
      const user = new User({
        ...userData,
        email: 'test+special@example.com'
      });

      await expect(user.save()).resolves.toBeTruthy();
    });

    test('should handle unicode characters', async () => {
      const user = new User({
        ...userData,
        firstName: 'José',
        lastName: 'García'
      });

      await expect(user.save()).resolves.toBeTruthy();
    });
  });
});
