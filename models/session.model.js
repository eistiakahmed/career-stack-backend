/**
 * Session Model
 * Mongoose schema for user sessions (for database-backed sessions)
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Session Schema
 */
const SessionSchema = new Schema(
  {
    // User reference
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Token information
    token: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Device information
    userAgent: {
      type: String,
    },
    device: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },

    // Location
    ip: {
      type: String,
    },
    location: {
      country: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },

    // Session status
    isActive: {
      type: Boolean,
      default: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },

    // Two-factor
    twoFactorVerified: {
      type: Boolean,
      default: false,
    },

    // Metadata
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
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
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ isActive: 1 });

/**
 * Virtuals
 */
SessionSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

SessionSchema.virtual('age').get(function () {
  return Date.now() - this.createdAt.getTime();
});

/**
 * Methods
 */

/**
 * Mark session as current
 */
SessionSchema.methods.markAsCurrent = function () {
  // Mark all other sessions for this user as not current
  return this.constructor
    .updateMany({ userId: this.userId, _id: { $ne: this._id } }, { isCurrent: false })
    .then(() => {
      this.isCurrent = true;
      return this.save();
    });
};

/**
 * Update last activity
 */
SessionSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

/**
 * Revoke session
 */
SessionSchema.methods.revoke = function () {
  this.isActive = false;
  return this.save();
};

/**
 * Check if session is valid
 */
SessionSchema.methods.isValid = function () {
  return this.isActive && !this.isExpired;
};

/**
 * Static methods
 */

/**
 * Find active sessions for user
 */
SessionSchema.statics.findActiveByUserId = function (userId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivity: -1 });
};

/**
 * Find current session for user
 */
SessionSchema.statics.findCurrentByUserId = function (userId) {
  return this.findOne({
    userId,
    isCurrent: true,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
};

/**
 * Create new session
 */
SessionSchema.statics.createSession = async function (sessionData) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await this.create({
    ...sessionData,
    expiresAt,
  });

  await session.markAsCurrent();

  return session;
};

/**
 * Revoke all sessions for user
 */
SessionSchema.statics.revokeAllForUser = function (userId) {
  return this.updateMany({ userId, isActive: true }, { isActive: false });
};

/**
 * Revoke all sessions except current
 */
SessionSchema.statics.revokeAllExceptCurrent = function (userId, currentSessionId) {
  return this.updateMany(
    {
      userId,
      _id: { $ne: currentSessionId },
      isActive: true,
    },
    { isActive: false }
  );
};

/**
 * Clean up expired sessions
 */
SessionSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    $or: [{ expiresAt: { $lt: new Date() } }, { isActive: false }],
  });
};

/**
 * Pre-save middleware
 */
SessionSchema.pre('save', function (next) {
  // Update last activity on save
  this.lastActivity = new Date();
  next();
});

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;
