/**
 * User Model
 * Mongoose schema for users with authentication and profile data
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * User Schema
 */
const UserSchema = new Schema(
  {
    // Authentication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
      index: true,
    },
    password: {
      type: String,
      required: false, // Not required for OAuth users
      minlength: 8,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['guest', 'user', 'premium', 'admin', 'super_admin'],
      default: 'user',
    },

    // Profile Information
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    avatar: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    website: {
      type: String,
      trim: true,
    },

    // Social Links
    socialLinks: {
      linkedIn: { type: String, trim: true },
      github: { type: String, trim: true },
      twitter: { type: String, trim: true },
      stackOverflow: { type: String, trim: true },
    },

    // Email Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Password Reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Two-Factor Authentication
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorBackupCodes: {
      type: [String],
      select: false,
    },

    // OAuth Providers
    providers: {
      google: {
        id: String,
        email: String,
        avatar: String,
      },
      github: {
        id: String,
        email: String,
        avatar: String,
      },
      linkedIn: {
        id: String,
        email: String,
        avatar: String,
      },
    },

    // Subscription
    subscriptionTier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'unpaid', 'trialing'],
      default: 'active',
    },
    subscriptionId: {
      type: String,
      index: true,
    },
    subscriptionEndsAt: {
      type: Date,
    },

    // Usage Tracking
    usage: {
      resumesCreated: {
        type: Number,
        default: 0,
      },
      aiCreditsUsed: {
        type: Number,
        default: 0,
      },
      pdfExports: {
        type: Number,
        default: 0,
      },
    },

    // Preferences
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      currency: {
        type: String,
        default: 'USD',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        marketing: {
          type: Boolean,
          default: false,
        },
        product: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Account Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending', 'deleted'],
      default: 'active',
    },

    // Portfolio
    portfolioUsername: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_-]+$/,
    },
    portfolioEnabled: {
      type: Boolean,
      default: false,
    },

    // Metadata
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes
 */
UserSchema.index({ subscriptionTier: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

/**
 * Virtuals
 */
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('initials').get(function () {
  return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase();
});

UserSchema.virtual('isPro').get(function () {
  return this.subscriptionTier === 'pro' || this.subscriptionTier === 'enterprise';
});

UserSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin' || this.role === 'super_admin';
});

/**
 * Methods
 */

/**
 * Compare password
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate email verification token
 */
UserSchema.methods.generateEmailVerificationToken = function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return token;
};

/**
 * Generate password reset token
 */
UserSchema.methods.generatePasswordResetToken = function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return token;
};

/**
 * Generate two-factor secret
 */
UserSchema.methods.generateTwoFactorSecret = function () {
  const speakeasy = require('speakeasy');
  const secret = speakeasy.generateSecret({
    name: `Resume Builder (${this.email})`,
    issuer: 'Resume Builder',
  });

  this.twoFactorSecret = secret.base32;
  this.twoFactorBackupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  return secret;
};

/**
 * Verify two-factor token
 */
UserSchema.methods.verifyTwoFactorToken = function (token) {
  const speakeasy = require('speakeasy');
  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2,
  });
};

/**
 * Update login information
 */
UserSchema.methods.updateLoginInfo = function (ip) {
  this.lastLoginAt = new Date();
  this.lastLoginIP = ip;
  this.loginCount += 1;
  return this.save();
};

/**
 * Get usage stats
 */
UserSchema.methods.getUsageStats = function () {
  const config = require('../config/env.config');

  const limits = {
    free: {
      maxResumes: config.limits.freePlan.resumes,
      maxAICredits: config.limits.freePlan.aiCredits,
    },
    pro: {
      maxResumes: -1, // Unlimited
      maxAICredits: -1, // Unlimited
    },
    enterprise: {
      maxResumes: -1,
      maxAICredits: -1,
    },
  };

  const tierLimits = limits[this.subscriptionTier] || limits.free;

  return {
    resumes: {
      used: this.usage.resumesCreated,
      limit: tierLimits.maxResumes,
      remaining:
        tierLimits.maxResumes === -1
          ? -1
          : Math.max(0, tierLimits.maxResumes - this.usage.resumesCreated),
    },
    aiCredits: {
      used: this.usage.aiCreditsUsed,
      limit: tierLimits.maxAICredits,
      remaining:
        tierLimits.maxAICredits === -1
          ? -1
          : Math.max(0, tierLimits.maxAICredits - this.usage.aiCreditsUsed),
    },
    pdfExports: {
      used: this.usage.pdfExports,
    },
  };
};

/**
 * Static methods
 */

/**
 * Find by email
 */
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find by email or portfolio username
 */
UserSchema.statics.findByEmailOrUsername = function (identifier) {
  return this.findOne({
    $or: [{ email: identifier.toLowerCase() }, { portfolioUsername: identifier.toLowerCase() }],
  });
};

/**
 * Get active users count
 */
UserSchema.statics.getActiveUsersCount = function () {
  return this.countDocuments({ status: 'active' });
};

/**
 * Pre-save middleware
 */
UserSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Generate display name if not set
  if (!this.displayName && this.firstName && this.lastName) {
    this.displayName = `${this.firstName} ${this.lastName}`;
  }

  next();
});

/**
 * Post-save middleware
 */
UserSchema.post('save', function (doc, next) {
  // Clear user cache
  const cache = require('../config/redis.config');
  cache.cacheDelete(`user:${doc._id}`).catch((err) => {
    console.error('Error clearing user cache:', err);
  });

  next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
