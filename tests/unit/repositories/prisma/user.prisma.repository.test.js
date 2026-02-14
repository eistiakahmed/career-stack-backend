/**
 * Prisma User Repository Unit Tests
 * Testing Prisma-based user repository
 */

const { prisma } = require('../../../../config/prisma.config');
const userRepository = require('../../../../repositories/prisma/user.prisma.repository');

describe('Prisma User Repository', () => {
  let testUserId;

  // Setup and teardown
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'prisma-test' }
      }
    });
  });

  describe('User CRUD Operations', () => {
    test('should create new user', async () => {
      const userData = {
        email: `prisma-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Prisma',
        lastName: 'Test',
      };

      const user = await userRepository.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.id).toBeDefined();

      testUserId = user.id;
    });

    test('should find user by email', async () => {
      const userData = {
        email: `find-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Find',
        lastName: 'Test',
      };

      await userRepository.createUser(userData);

      const found = await userRepository.findByEmail(userData.email);

      expect(found).toBeDefined();
      expect(found.email).toBe(userData.email);
    });

    test('should return null for non-existent email', async () => {
      const found = await userRepository.findByEmail('nonexistent@example.com');

      expect(found).toBeNull();
    });

    test('should check email existence', async () => {
      const userData = {
        email: `exists-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Exists',
        lastName: 'Test',
      };

      await userRepository.createUser(userData);

      const exists = await userRepository.emailExists(userData.email);

      expect(exists).toBe(true);
    });

    test('should update user profile', async () => {
      const userData = {
        email: `update-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Update',
        lastName: 'Test',
      };

      const user = await userRepository.createUser(userData);

      const updated = await userRepository.updateProfile(user.id, {
        firstName: 'Updated',
        bio: 'Test bio',
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.bio).toBe('Test bio');
    });

    test('should update password', async () => {
      const userData = {
        email: `password-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Password',
        lastName: 'Test',
      };

      const user = await userRepository.createUser(userData);

      const newHashedPassword = 'newHashedPassword456';

      await userRepository.updatePassword(user.id, newHashedPassword);

      const updated = await userRepository.findById(user.id);

      expect(updated.password).toBe(newHashedPassword);
    });

    test('should verify email', async () => {
      const userData = {
        email: `verify-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Verify',
        lastName: 'Test',
        emailVerificationToken: 'verification-token-123',
        emailVerificationExpires: new Date(Date.now() + 3600000),
      };

      const user = await userRepository.createUser(userData);

      expect(user.isEmailVerified).toBe(false);

      const verified = await userRepository.verifyEmail(user.id);

      expect(verified.isEmailVerified).toBe(true);
    });

    test('should set password reset token', async () => {
      const userData = {
        email: `reset-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Reset',
        lastName: 'Test',
      };

      const user = await userRepository.createUser(userData);

      const resetToken = 'reset-token-123';
      const expiresAt = new Date(Date.now() + 3600000);

      await userRepository.setPasswordResetToken(user.id, resetToken, expiresAt);

      const updated = await userRepository.findById(user.id);

      expect(updated.resetPasswordToken).toBe(resetToken);
      expect(updated.resetPasswordExpires).toBeDefined();
    });

    test('should find users with pagination', async () => {
      // Create multiple users
      const promises = [];
      for (let i = 0; i < 25; i++) {
        promises.push(
          userRepository.createUser({
            email: `pagination-test-${i}-${Date.now()}@example.com`,
            password: 'hashedPassword123',
            firstName: `User${i}`,
            lastName: 'Test',
          })
        );
      }

      await Promise.all(promises);

      const result = await userRepository.findAll({
        page: 1,
        limit: 10,
      });

      expect(result.users).toHaveLength(10);
      expect(result.pagination.total).toBeGreaterThan(24);
      expect(result.pagination.page).toBe(1);
    });

    test('should delete user', async () => {
      const userData = {
        email: `delete-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Delete',
        lastName: 'Test',
      };

      const user = await userRepository.createUser(userData);

      await userRepository.deleteUser(user.id);

      const deleted = await userRepository.findById(user.id);

      expect(deleted).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should throw ConflictError for duplicate email', async () => {
      const userData = {
        email: `conflict-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Conflict',
        lastName: 'Test',
      };

      await userRepository.createUser(userData);

      await expect(
        userRepository.createUser(userData)
      ).rejects.toThrow('Email already registered');
    });

    test('should throw NotFoundError for updating non-existent user', async () => {
      const fakeId = '64f1a2b3c4d5e6f7a8b9c0d1';

      await expect(
        userRepository.updateProfile(fakeId, { firstName: 'Updated' })
      ).rejects.toThrow('User not found');
    });

    test('should throw NotFoundError for non-existent user deletion', async () => {
      const fakeId = '64f1a2b3c4d5e6f7a8b9c0d1';

      await expect(
        userRepository.deleteUser(fakeId)
      ).rejects.toThrow('User not found');
    });
  });

  describe('Subscription Management', () => {
    test('should update subscription tier', async () => {
      const userData = {
        email: `subscription-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Subscription',
        lastName: 'Test',
        subscriptionTier: 'FREE',
      };

      const user = await userRepository.createUser(userData);

      expect(user.subscriptionTier).toBe('FREE');

      const updated = await userRepository.updateSubscriptionTier(user.id, 'PRO');

      expect(updated.subscriptionTier).toBe('PRO');
    });

    test('should increment AI usage', async () => {
      const userData = {
        email: `ai-usage-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'AI',
        lastName: 'Test',
      };

      const user = await userRepository.createUser(userData);

      expect(user.aiCreditsUsed).toBe(0);

      const updated = await userRepository.incrementAIUsage(user.id);

      expect(updated.aiCreditsUsed).toBe(1);
    });
  });

  describe('Performance', () => {
    test('should handle concurrent user creation', async () => {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          userRepository.createUser({
            email: `concurrent-test-${i}-${Date.now()}@example.com`,
            password: 'hashedPassword123',
            firstName: `User${i}`,
            lastName: 'Test',
          })
        );
      }

      const results = await Promise.allSettled(promises);

      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBe(50);
    });

    test('should find users quickly', async () => {
      // Create some users
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          userRepository.createUser({
            email: `perf-test-${i}-${Date.now()}@example.com`,
            password: 'hashedPassword123',
            firstName: `Perf${i}`,
            lastName: 'Test',
          })
        );
      }

      await Promise.all(promises);

      const start = Date.now();

      await userRepository.findAll({ limit: 20 });

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // Should be fast
    });
  });

  describe('Data Integrity', () => {
    test('should maintain user relationships', async () => {
      const userData = {
        email: `relation-test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        firstName: 'Relation',
        lastName: 'Test',
      };

      const user = await userRepository.createUser(userData);

      // Create related data
      await prisma.resume.create({
        data: {
          userId: user.id,
          title: 'Test Resume',
          slug: `test-resume-${Date.now()}`,
          templateId: 'template-id-123',
        },
      });

      const userWithResumes = await prisma.user.findUnique({
        where: { id: user.id },
        include: { resumes: true },
      });

      expect(userWithResumes).toBeDefined();
      expect(userWithResumes.resumes).toBeDefined();
    });
  });
});
