/**
 * Subscription Model
 * Mongoose schema for user subscriptions and payment tracking
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Subscription Schema
 */
const SubscriptionSchema = new Schema(
  {
    // User reference
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Stripe subscription details
    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripePriceId: {
      type: String,
    },

    // Plan details
    plan: {
      type: String,
      enum: ['free', 'pro_monthly', 'pro_yearly', 'enterprise'],
      required: true,
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'unpaid', 'trialing', 'incomplete'],
      default: 'active',
    },

    // Billing cycle
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },

    // Payment details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    interval: {
      type: String,
      enum: ['month', 'year'],
      required: true,
    },

    // Trial
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },

    // Usage limits for enterprise
    customLimits: {
      maxResumes: {
        type: Number,
        default: -1, // Unlimited
      },
      maxAICredits: {
        type: Number,
        default: -1, // Unlimited
      },
      maxUsers: {
        type: Number,
        default: 1,
      },
    },

    // Features
    features: {
      templates: {
        type: [String],
        default: ['basic'],
      },
      exportQuality: {
        type: String,
        enum: ['standard', 'high', 'premium'],
        default: 'standard',
      },
      portfolio: {
        type: Boolean,
        default: false,
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
      customTemplates: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
    },

    // Metadata
    metadata: {
      type: Map,
      of: String,
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
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });

/**
 * Virtuals
 */
SubscriptionSchema.virtual('isActive').get(function () {
  return this.status === 'active' || this.status === 'trialing';
});

SubscriptionSchema.virtual('isCanceled').get(function () {
  return this.status === 'canceled' || this.cancelAtPeriodEnd;
});

SubscriptionSchema.virtual('isTrial').get(function () {
  return this.status === 'trialing';
});

SubscriptionSchema.virtual('daysUntilRenewal').get(function () {
  if (!this.currentPeriodEnd) return null;
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.ceil((this.currentPeriodEnd - new Date()) / msInDay);
});

/**
 * Methods
 */

/**
 * Check if user can access feature
 */
SubscriptionSchema.methods.canAccessFeature = function (feature) {
  if (this.tier === 'enterprise') return true;

  const featureAccess = {
    free: ['basic_templates', 'standard_export'],
    pro: [
      'all_templates',
      'high_export',
      'portfolio',
      'ai_features',
      'priority_support',
    ],
    enterprise: ['all'],
  };

  return featureAccess[this.tier]?.includes(feature) || false;
};

/**
 * Get usage limits
 */
SubscriptionSchema.methods.getUsageLimits = function () {
  const limits = {
    free: {
      maxResumes: 3,
      maxAICredits: 5,
    },
    pro: {
      maxResumes: -1,
      maxAICredits: -1,
    },
  };

  if (this.tier === 'enterprise') {
    return {
      maxResumes: this.customLimits.maxResumes,
      maxAICredits: this.customLimits.maxAICredits,
    };
  }

  return limits[this.tier] || limits.free;
};

/**
 * Check if subscription is active
 */
SubscriptionSchema.methods.isSubscriptionActive = function () {
  const now = new Date();
  return (
    (this.status === 'active' || this.status === 'trialing') &&
    (!this.currentPeriodEnd || this.currentPeriodEnd > now)
  );
};

/**
 * Static methods
 */

/**
 * Find active subscription for user
 */
SubscriptionSchema.statics.findActiveByUserId = function (userId) {
  return this.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  }).sort({ createdAt: -1 });
};

/**
 * Find expiring subscriptions (within 7 days)
 */
SubscriptionSchema.statics.findExpiringSoon = function () {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return this.find({
    status: 'active',
    currentPeriodEnd: { $lte: sevenDaysFromNow },
    cancelAtPeriodEnd: false,
  });
};

/**
 * Update subscription from Stripe
 */
SubscriptionSchema.statics.createFromStripe = function (stripeSubscription) {
  return this.create({
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: stripeSubscription.customer,
    stripePriceId: stripeSubscription.items.data[0].price.id,
    plan: this.getPlanFromPriceId(stripeSubscription.items.data[0].price.id),
    tier: this.getTierFromPriceId(stripeSubscription.items.data[0].price.id),
    status: stripeSubscription.status,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    amount: stripeSubscription.items.data[0].price.unit_amount / 100,
    currency: stripeSubscription.items.data[0].price.currency.toUpperCase(),
    interval: stripeSubscription.items.data[0].price.recurring.interval,
    trialStart: stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000)
      : null,
    trialEnd: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : null,
  });
};

/**
 * Get plan from Stripe price ID
 */
SubscriptionSchema.statics.getPlanFromPriceId = function (priceId) {
  if (priceId.includes('monthly')) return 'pro_monthly';
  if (priceId.includes('yearly')) return 'pro_yearly';
  return 'free';
};

/**
 * Get tier from Stripe price ID
 */
SubscriptionSchema.statics.getTierFromPriceId = function (priceId) {
  if (priceId.includes('enterprise')) return 'enterprise';
  if (priceId.includes('pro')) return 'pro';
  return 'free';
};

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription;
