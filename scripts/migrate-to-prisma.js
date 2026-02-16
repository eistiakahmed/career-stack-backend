/**
 * Migrate from Mongoose to Prisma
 * Script to migrate existing data and switch to Prisma
 */

const mongoose = require('mongoose');
const { prisma } = require('../config/prisma.config');
const logger = require('../utils/logger');
const config = require('../config/env.config');

// Original Mongoose models
const User = require('../models/user.model');
const Resume = require('../models/resume.model');

/**
 * Connect to MongoDB
 */
async function connect() {
  try {
    await mongoose.connect(config.database.uri);
    logger.info('✓ MongoDB connected (Mongoose)');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnect() {
  try {
    await mongoose.disconnect();
    await prisma.$disconnect();
    logger.info('✓ All database connections closed');
  } catch (error) {
    logger.error('Error disconnecting:', error);
    throw error;
  }
}

/**
 * Migrate users from Mongoose to Prisma
 */
async function migrateUsers() {
  try {
    logger.info('Starting user migration...');

    const mongooseUsers = await User.find({});

    logger.info(`Found ${mongooseUsers.length} users to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of mongooseUsers) {
      try {
        await prisma.user.create({
          data: {
            id: user._id.toString(),
            email: user.email,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            subscriptionTier: user.subscriptionTier || 'FREE',
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            website: user.website,
            linkedinUrl: user.linkedinUrl,
            githubUrl: user.githubUrl,
            portfolioUrl: user.portfolioUrl,
            isEmailVerified: user.isEmailVerified || false,
            emailVerificationToken: user.emailVerificationToken,
            emailVerificationExpires: user.emailVerificationExpires,
            resetPasswordToken: user.resetPasswordToken,
            resetPasswordExpires: user.resetPasswordExpires,
            oauthProviders: user.oauthProviders,
            socialId: user.socialId,
            twoFactorEnabled: user.twoFactorEnabled || false,
            twoFactorSecret: user.twoFactorSecret,
            subscriptionId: user.subscriptionId,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEndsAt: user.subscriptionEndsAt,
            aiCreditsUsed: user.aiCreditsUsed || 0,
            resumesCreated: user.resumesCreated || 0,
            portfolioUsername: user.portfolioUsername,
            portfolioEnabled: user.portfolioEnabled || false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(`Error migrating user ${user.email}:`, error.message);
      }
    }

    logger.info(`✓ User migration complete: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    logger.error('Error migrating users:', error);
    throw error;
  }
}

/**
 * Migrate resumes from Mongoose to Prisma
 */
async function migrateResumes() {
  try {
    logger.info('Starting resume migration...');

    const mongooseResumes = await Resume.find({});

    logger.info(`Found ${mongooseResumes.length} resumes to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const resume of mongooseResumes) {
      try {
        await prisma.resume.create({
          data: {
            id: resume._id.toString(),
            userId: resume.userId.toString(),
            title: resume.title,
            slug: resume.slug,
            targetJobTitle: resume.targetJobTitle,
            templateId: resume.templateId?.toString(),
            status: resume.status || 'DRAFT',
            isPublic: resume.isPublic || false,
            shareToken: resume.shareToken,
            isShared: resume.isShared || false,
            shareExpiresAt: resume.shareExpiresAt,
            summary: resume.summary,
            workExperience: resume.workExperience || [],
            education: resume.education || [],
            skills: resume.skills || [],
            projects: resume.projects || [],
            certifications: resume.certifications || [],
            languages: resume.languages || [],
            interests: resume.interests || [],
            customSections: resume.customSections || [],
            sectionOrder: resume.sectionOrder,
            hiddenSections: resume.hiddenSections,
            styling: resume.styling,
            atsAnalysis: resume.atsAnalysis,
            aiCreditsUsed: resume.aiCreditsUsed || 0,
            lastModifiedAt: resume.lastModifiedAt,
            createdAt: resume.createdAt,
            updatedAt: resume.updatedAt,
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(`Error migrating resume ${resume.title}:`, error.message);
      }
    }

    logger.info(`✓ Resume migration complete: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    logger.error('Error migrating resumes:', error);
    throw error;
  }
}

/**
 * Verify migration
 */
async function verifyMigration() {
  try {
    logger.info('Verifying migration...');

    const [userCount, resumeCount] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
    ]);

    logger.info(`✓ Verification complete:`);
    logger.info(`  - Users: ${userCount}`);
    logger.info(`  - Resumes: ${resumeCount}`);
  } catch (error) {
    logger.error('Error verifying migration:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  logger.info('Starting migration from Mongoose to Prisma...');
  logger.info('='.repeat(60));

  try {
    // Connect to databases
    await connect();
    await prisma.$connect();

    // Migrate data
    await migrateUsers();
    await migrateResumes();

    // Verify migration
    await verifyMigration();

    logger.info('='.repeat(60));
    logger.info('✅ Migration completed successfully!');
    logger.info('');
    logger.info('Next steps:');
    logger.info('1. Verify data in Prisma Studio: npm run prisma:studio');
    logger.info('2. Test Prisma repositories: npm test -- tests/unit/repositories/prisma');
    logger.info('3. Update services to use Prisma repositories');
    logger.info('4. Gradually remove Mongoose dependencies');

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await disconnect();
  }
}

/**
 * Rollback migration
 */
async function rollback() {
  try {
    logger.info('Starting rollback...');

    // Delete all Prisma data
    await prisma.event.deleteMany({});
    await prisma.analytics.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.resume.deleteMany({});
    await prisma.user.deleteMany({});

    logger.info('✓ Rollback complete - all Prisma data deleted');
  } catch (error) {
    logger.error('Error during rollback:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  migrate,
  rollback,
  migrateUsers,
  migrateResumes,
  verifyMigration,
};

// Run migration if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--rollback')) {
    rollback().catch(console.error);
  } else {
    migrate().catch(console.error);
  }
}
