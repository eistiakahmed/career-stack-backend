/**
 * Analytics Model
 * Mongoose schema for tracking user analytics and events
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Event Schema (for individual events)
 */
const EventSchema = new Schema(
  {
    // User info (optional for anonymous events)
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Event details
    eventType: {
      type: String,
      required: true,
      enum: [
        // User events
        'user_registered',
        'user_verified',
        'user_login',
        'user_logout',
        'user_subscription_changed',
        'user_profile_updated',

        // Resume events
        'resume_created',
        'resume_updated',
        'resume_deleted',
        'resume_viewed',
        'resume_downloaded',
        'resume_shared',
        'resume_template_changed',

        // AI events
        'ai_optimization_used',
        'ai_ats_scored',
        'ai_career_objective_generated',
        'ai_content_improved',

        // Portfolio events
        'portfolio_viewed',
        'portfolio_created',
        'portfolio_updated',

        // Feature usage
        'template_used',
        'export_pdf',
        'export_docx',

        // Errors
        'error_occurred',
      ],
    },

    // Event properties
    properties: {
      type: Map,
      of: Schema.Types.Mixed,
    },

    // Request context
    context: {
      ip: String,
      userAgent: String,
      url: String,
      referer: String,
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

/**
 * Aggregated Analytics Schema (for daily/monthly stats)
 */
const AnalyticsSchema = new Schema(
  {
    // User reference
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Period (day or month)
    period: {
      type: String,
      enum: ['daily', 'monthly'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },

    // Resume stats
    resumes: {
      created: {
        type: Number,
        default: 0,
      },
      updated: {
        type: Number,
        default: 0,
      },
      deleted: {
        type: Number,
        default: 0,
      },
      downloaded: {
        type: Number,
        default: 0,
      },
      shared: {
        type: Number,
        default: 0,
      },
      viewed: {
        type: Number,
        default: 0,
      },
    },

    // AI usage
    aiUsage: {
      optimizations: {
        type: Number,
        default: 0,
      },
      atsScores: {
        type: Number,
        default: 0,
      },
      careerObjectives: {
        type: Number,
        default: 0,
      },
      contentImprovements: {
        type: Number,
        default: 0,
      },
      creditsUsed: {
        type: Number,
        default: 0,
      },
    },

    // Portfolio stats
    portfolio: {
      views: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
    },

    // Session stats
    sessions: {
      count: {
        type: Number,
        default: 0,
      },
      totalDuration: {
        type: Number,
        default: 0,
      },
      averageDuration: {
        type: Number,
        default: 0,
      },
    },

    // Feature usage
    features: {
      templatesUsed: {
        type: Map,
        of: Number,
        default: {},
      },
      exports: {
        pdf: {
          type: Number,
          default: 0,
        },
        docx: {
          type: Number,
          default: 0,
        },
      },
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
EventSchema.index({ userId: 1, timestamp: -1 });
EventSchema.index({ eventType: 1, timestamp: -1 });
EventSchema.index({ timestamp: -1 });

AnalyticsSchema.index({ userId: 1, period: 1, date: -1 }, { unique: true });
AnalyticsSchema.index({ period: 1, date: -1 });

/**
 * Event Model Methods
 */

/**
 * Track event
 */
EventSchema.statics.track = async function (eventType, userId, properties = {}, context = {}) {
  return this.create({
    eventType,
    userId,
    properties,
    context,
    timestamp: new Date(),
  });
};

/**
 * Get events for user
 */
EventSchema.statics.getUserEvents = function (userId, options = {}) {
  const {
    eventType,
    startDate,
    endDate,
    limit = 100,
    skip = 0,
  } = options;

  const query = { userId };

  if (eventType) query.eventType = eventType;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip);
};

/**
 * Analytics Model Methods
 */

/**
 * Get or create daily analytics
 */
AnalyticsSchema.statics.getDailyAnalytics = function (userId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  return this.findOneAndUpdate(
    { userId, period: 'daily', date: startOfDay },
    { $setOnInsert: { userId, period: 'daily', date: startOfDay } },
    { upsert: true, new: true }
  );
};

/**
 * Get or create monthly analytics
 */
AnalyticsSchema.statics.getMonthlyAnalytics = function (userId, date = new Date()) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

  return this.findOneAndUpdate(
    { userId, period: 'monthly', date: startOfMonth },
    { $setOnInsert: { userId, period: 'monthly', date: startOfMonth } },
    { upsert: true, new: true }
  );
};

/**
 * Increment stats
 */
AnalyticsSchema.statics.incrementStat = async function (
  userId,
  category,
  stat,
  increment = 1
) {
  const daily = await this.getDailyAnalytics(userId);
  const key = `${category}.${stat}`;

  daily.$inc(key, increment);
  await daily.save();

  return daily;
};

/**
 * Get user analytics summary
 */
AnalyticsSchema.statics.getUserSummary = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const analytics = await this.find({
    userId,
    period: 'daily',
    date: { $gte: startDate },
  }).sort({ date: 1 });

  const summary = {
    resumes: {
      created: 0,
      updated: 0,
      downloaded: 0,
      shared: 0,
      viewed: 0,
    },
    aiUsage: {
      optimizations: 0,
      atsScores: 0,
      careerObjectives: 0,
      creditsUsed: 0,
    },
    portfolio: {
      views: 0,
    },
    exports: {
      pdf: 0,
      docx: 0,
    },
    daily: analytics.map((a) => ({
      date: a.date,
      resumes: a.resumes,
      aiUsage: a.aiUsage,
    })),
  };

  analytics.forEach((a) => {
    summary.resumes.created += a.resumes.created;
    summary.resumes.updated += a.resumes.updated;
    summary.resumes.downloaded += a.resumes.downloaded;
    summary.resumes.shared += a.resumes.shared;
    summary.resumes.viewed += a.resumes.viewed;

    summary.aiUsage.optimizations += a.aiUsage.optimizations;
    summary.aiUsage.atsScores += a.aiUsage.atsScores;
    summary.aiUsage.careerObjectives += a.aiUsage.careerObjectives;
    summary.aiUsage.creditsUsed += a.aiUsage.creditsUsed;

    summary.portfolio.views += a.portfolio.views;

    summary.exports.pdf += a.features.exports.pdf;
    summary.exports.docx += a.features.exports.docx;
  });

  return summary;
};

/**
 * Clean up old events
 */
EventSchema.statics.cleanupOldEvents = function (daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
  });
};

/**
 * Clean up old analytics
 */
AnalyticsSchema.statics.cleanupOldAnalytics = function (monthsToKeep = 12) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);

  return this.deleteMany({
    period: 'daily',
    date: { $lt: cutoffDate },
  });
};

const Event = mongoose.model('Event', EventSchema);
const Analytics = mongoose.model('Analytics', AnalyticsSchema);

module.exports = { Event, Analytics };
