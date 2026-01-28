/**
 * Template Model
 * Mongoose schema for resume templates
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Template Schema
 */
const TemplateSchema = new Schema(
  {
    // Basic info
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Categorization
    category: {
      type: String,
      enum: ['minimal', 'corporate', 'executive', 'developer', 'creative', 'ats', 'modern', 'startup'],
      required: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'executive', 'any'],
      default: 'any',
    },

    // Access control
    isPremium: {
      type: Boolean,
      default: false,
    },
    requiredTier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },

    // Visual assets
    thumbnail: {
      type: String,
      required: true,
    },
    preview: {
      type: String,
      required: true,
    },
    screenshots: [
      {
        type: String,
      },
    ],

    // Template configuration
    config: {
      layout: {
        type: String,
        enum: ['single-column', 'two-column', 'three-column'],
        default: 'single-column',
      },
      sections: {
        type: [String],
        default: ['header', 'summary', 'experience', 'education', 'skills'],
      },
      fonts: {
        heading: {
          type: String,
          default: 'Inter',
        },
        body: {
          type: String,
          default: 'Inter',
        },
      },
      colors: {
        primary: {
          type: String,
          default: '#000000',
        },
        accent: {
          type: String,
          default: '#2563eb',
        },
      },
      spacing: {
        type: String,
        enum: ['compact', 'normal', 'relaxed'],
        default: 'normal',
      },
    },

    // Features
    features: [
      {
        type: String,
        enum: [
          'ats-friendly',
          'two-column',
          'photo',
          'modern-design',
          'classic',
          'creative',
          'minimal',
          'colorful',
          'professional',
          'entry-level',
          'executive',
          'technical',
        ],
      },
    ],

    // Usage statistics
    usageCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },

    // Creator info
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isOfficial: {
      type: Boolean,
      default: true,
    },

    // Customization options available
    customizationOptions: {
      canChangeFont: {
        type: Boolean,
        default: true,
      },
      canChangeColors: {
        type: Boolean,
        default: true,
      },
      canChangeSpacing: {
        type: Boolean,
        default: true,
      },
      canChangeLayout: {
        type: Boolean,
        default: false,
      },
      canAddPhoto: {
        type: Boolean,
        default: false,
      },
      canAddLogo: {
        type: Boolean,
        default: false,
      },
    },

    // Metadata
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    sort_order: {
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
TemplateSchema.index({ category: 1 });
TemplateSchema.index({ requiredTier: 1 });
TemplateSchema.index({ isActive: 1, isFeatured: 1 });
TemplateSchema.index({ usageCount: -1 });
TemplateSchema.index({ rating: -1 });

/**
 * Virtuals
 */
TemplateSchema.virtual('isFree').get(function () {
  return this.requiredTier === 'free';
});

TemplateSchema.virtual('averageRating').get(function () {
  return this.reviewsCount > 0 ? this.rating / this.reviewsCount : 0;
});

/**
 * Methods
 */

/**
 * Increment usage count
 */
TemplateSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

/**
 * Check if user can access template
 */
TemplateSchema.methods.canBeAccessedBy = function (userTier) {
  const tiers = { free: 0, pro: 1, enterprise: 2 };
  const requiredLevel = tiers[this.requiredTier] || 0;
  const userLevel = tiers[userTier] || 0;

  return userLevel >= requiredLevel;
};

/**
 * Static methods
 */

/**
 * Find active templates
 */
TemplateSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

/**
 * Find by category
 */
TemplateSchema.statics.findByCategory = function (category) {
  return this.find({ category, isActive: true });
};

/**
 * Find by tier
 */
TemplateSchema.statics.findByTier = function (tier) {
  return this.find({
    requiredTier: { $in: ['free', tier] },
    isActive: true,
  });
};

/**
 * Find featured templates
 */
TemplateSchema.statics.findFeatured = function () {
  return this.find({ isFeatured: true, isActive: true }).sort({ sort_order: 1 });
};

/**
 * Alias for findFeatured
 */
TemplateSchema.statics.findFeaturedTemplates = function () {
  return this.findFeatured();
};

/**
 * Find popular templates
 */
TemplateSchema.statics.findPopular = function (limit = 10) {
  return this.find({ isActive: true }).sort({ usageCount: -1 }).limit(limit);
};

/**
 * Find highest rated templates
 */
TemplateSchema.statics.findHighestRated = function (limit = 10) {
  return this.find({ isActive: true }).sort({ rating: -1 }).limit(limit);
};

/**
 * Search templates
 */
TemplateSchema.statics.search = function (query, filters = {}) {
  const {
    category,
    tier,
    industry,
    experienceLevel,
    isPremium,
    isFeatured,
  } = filters;

  const searchQuery = {
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  };

  if (category) searchQuery.category = category;
  if (tier) searchQuery.requiredTier = { $in: ['free', tier] };
  if (industry) searchQuery.industry = industry;
  if (experienceLevel) searchQuery.experienceLevel = experienceLevel;
  if (isPremium !== undefined) searchQuery.isPremium = isPremium;
  if (isFeatured) searchQuery.isFeatured = true;

  return this.find(searchQuery);
};

/**
 * Pre-save middleware
 */
TemplateSchema.pre('save', function (next) {
  // Generate slug from name if not set
  if (!this.slug && this.name) {
    const crypto = require('crypto');
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  next();
});

const Template = mongoose.model('Template', TemplateSchema);

module.exports = Template;
