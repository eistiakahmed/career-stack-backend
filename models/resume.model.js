/**
 * Resume Model
 * Mongoose schema for resumes with all sections and metadata
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Work Experience Sub-schema
 */
const WorkExperienceSchema = new Schema({
  company: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  position: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    default: null, // null for current position
  },
  isCurrentPosition: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  achievements: [{
    type: String,
    trim: true,
    maxlength: 1000,
  }],
  skillsUsed: [{
    type: String,
    trim: true,
  }],
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'other'],
    default: 'full-time',
  },
}, { _id: true });

/**
 * Education Sub-schema
 */
const EducationSchema = new Schema({
  institution: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  degree: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  field: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    default: null,
  },
  isCurrentlyStudying: {
    type: Boolean,
    default: false,
  },
  gpa: {
    type: String,
    trim: true,
  },
  honors: [{
    type: String,
    trim: true,
  }],
  coursework: [{
    type: String,
    trim: true,
  }],
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
}, { _id: true });

/**
 * Skill Sub-schema
 */
const SkillSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  category: {
    type: String,
    enum: ['technical', 'soft', 'language', 'tool', 'framework', 'database', 'other'],
    default: 'technical',
  },
  proficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert', 'native'],
    default: 'intermediate',
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0,
  },
  lastUsed: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

/**
 * Project Sub-schema
 */
const ProjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    default: null,
  },
  isOngoing: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  technologies: [{
    type: String,
    trim: true,
  }],
  achievements: [{
    type: String,
    trim: true,
    maxlength: 500,
  }],
  links: {
    github: {
      type: String,
      trim: true,
    },
    live: {
      type: String,
      trim: true,
    },
    demo: {
      type: String,
      trim: true,
    },
    other: [{
      name: String,
      url: String,
    }],
  },
  teamSize: {
    type: Number,
    min: 1,
  },
}, { _id: true });

/**
 * Certification Sub-schema
 */
const CertificationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  issuer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  issueDate: {
    type: Date,
    required: true,
  },
  expirationDate: {
    type: Date,
    default: null,
  },
  credentialId: {
    type: String,
    trim: true,
  },
  credentialUrl: {
    type: String,
    trim: true,
  },
  doesNotExpire: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

/**
 * Language Sub-schema
 */
const LanguageSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  proficiency: {
    type: String,
    enum: ['basic', 'conversational', 'professional', 'fluent', 'native'],
    default: 'conversational',
  },
}, { _id: true });

/**
 * Custom Section Sub-schema
 */
const CustomSectionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
  },
  items: [{
    title: String,
    subtitle: String,
    description: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean,
  }],
}, { _id: true });

/**
 * ATS Analysis Sub-schema
 */
const ATSAnalysisSchema = new Schema({
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  lastAnalyzed: {
    type: Date,
    default: null,
  },
  keywordMatches: [{
    keyword: String,
    found: Boolean,
  }],
  missingKeywords: [String],
  suggestions: [{
    type: {
      type: String,
      enum: ['critical', 'warning', 'info'],
    },
    category: String,
    message: String,
    field: String,
  }],
  jobDescription: {
    type: String,
    default: null,
  },
});

/**
 * Resume Main Schema
 */
const ResumeSchema = new Schema({
  // Owner reference
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Basic info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    default: 'My Resume',
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 255,
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
  linkedIn: {
    type: String,
    trim: true,
  },
  github: {
    type: String,
    trim: true,
  },
  portfolio: {
    type: String,
    trim: true,
  },

  // Professional summary/objective
  summary: {
    type: String,
    trim: true,
    maxlength: 2000,
  },

  // Sections
  workExperience: [WorkExperienceSchema],
  education: [EducationSchema],
  skills: [SkillSchema],
  projects: [ProjectSchema],
  certifications: [CertificationSchema],
  languages: [LanguageSchema],
  customSections: [CustomSectionSchema],

  // Additional sections
  awards: [{
    title: String,
    issuer: String,
    date: Date,
    description: String,
  }],
  publications: [{
    title: String,
    publisher: String,
    date: Date,
    url: String,
    description: String,
  }],
  patents: [{
    title: String,
    patentNumber: String,
    issueDate: Date,
    url: String,
  }],
  volunteerWork: [{
    organization: String,
    role: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean,
    description: String,
  }],
  interests: [{
    type: String,
    trim: true,
  }],

  // Template and styling
  template: {
    id: {
      type: String,
      required: true,
      default: 'modern',
    },
    category: {
      type: String,
      enum: ['minimal', 'corporate', 'executive', 'developer', 'creative', 'ats', 'modern', 'startup'],
      default: 'modern',
    },
    customizations: {
      font: {
        type: String,
        default: 'Inter',
      },
      fontSize: {
        type: Number,
        default: 11,
        min: 9,
        max: 14,
      },
      lineSpacing: {
        type: Number,
        default: 1.15,
        min: 1.0,
        max: 2.0,
      },
      sectionSpacing: {
        type: Number,
        default: 12,
        min: 8,
        max: 24,
      },
      margin: {
        top: {
          type: Number,
          default: 12,
        },
        bottom: {
          type: Number,
          default: 12,
        },
        left: {
          type: Number,
          default: 12,
        },
        right: {
          type: Number,
          default: 12,
        },
      },
      accentColor: {
        type: String,
        default: '#2563eb',
      },
      showSectionDividers: {
        type: Boolean,
        default: true,
      },
    },
  },

  // Section visibility and order
  sectionOrder: {
    type: [String],
    default: ['summary', 'experience', 'education', 'skills', 'projects'],
  },
  hiddenSections: {
    type: [String],
    default: [],
  },

  // ATS analysis
  atsAnalysis: ATSAnalysisSchema,

  // Metadata
  isPublic: {
    type: Boolean,
    default: false,
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'complete', 'archived'],
    default: 'draft',
  },

  // AI optimization credits used
  aiCreditsUsed: {
    type: Number,
    default: 0,
  },

  // Last modification info
  lastAutoSave: {
    type: Date,
    default: null,
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * Indexes
 */
ResumeSchema.index({ userId: 1, createdAt: -1 });
ResumeSchema.index({ userId: 1, status: 1 });
ResumeSchema.index({ isPublic: 1, createdAt: -1 });

/**
 * Virtuals
 */
ResumeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

ResumeSchema.virtual('isComplete').get(function() {
  return this.status === 'complete';
});

/**
 * Methods
 */

/**
 * Add work experience
 */
ResumeSchema.methods.addExperience = function(experienceData) {
  this.workExperience.push(experienceData);
  this.lastModified = new Date();
  return this.save();
};

/**
 * Update work experience
 */
ResumeSchema.methods.updateExperience = function(experienceId, updateData) {
  const experience = this.workExperience.id(experienceId);
  if (!experience) {
    throw new Error('Experience not found');
  }
  Object.assign(experience, updateData);
  this.lastModified = new Date();
  return this.save();
};

/**
 * Delete work experience
 */
ResumeSchema.methods.deleteExperience = function(experienceId) {
  this.workExperience.id(experienceId).remove();
  this.lastModified = new Date();
  return this.save();
};

/**
 * Add education
 */
ResumeSchema.methods.addEducation = function(educationData) {
  this.education.push(educationData);
  this.lastModified = new Date();
  return this.save();
};

/**
 * Update education
 */
ResumeSchema.methods.updateEducation = function(educationId, updateData) {
  const education = this.education.id(educationId);
  if (!education) {
    throw new Error('Education not found');
  }
  Object.assign(education, updateData);
  this.lastModified = new Date();
  return this.save();
};

/**
 * Delete education
 */
ResumeSchema.methods.deleteEducation = function(educationId) {
  this.education.id(educationId).remove();
  this.lastModified = new Date();
  return this.save();
};

/**
 * Reorder sections
 */
ResumeSchema.methods.reorderSections = function(newOrder) {
  this.sectionOrder = newOrder;
  this.lastModified = new Date();
  return this.save();
};

/**
 * Toggle section visibility
 */
ResumeSchema.methods.toggleSection = function(sectionName) {
  const index = this.hiddenSections.indexOf(sectionName);
  if (index > -1) {
    this.hiddenSections.splice(index, 1);
  } else {
    this.hiddenSections.push(sectionName);
  }
  this.lastModified = new Date();
  return this.save();
};

/**
 * Generate share token
 */
ResumeSchema.methods.generateShareToken = function() {
  const crypto = require('crypto');
  this.shareToken = crypto.randomBytes(32).toString('hex');
  return this.save();
};

/**
 * Update ATS analysis
 */
ResumeSchema.methods.updateATSAnalysis = function(analysisData) {
  this.atsAnalysis = {
    ...this.atsAnalysis,
    ...analysisData,
    lastAnalyzed: new Date(),
  };
  return this.save();
};

/**
 * Static methods
 */

/**
 * Get user resumes
 */
ResumeSchema.statics.getUserResumes = function(userId, options = {}) {
  const query = {
    userId,
    ...(options.status && { status: options.status }),
  };

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);
};

/**
 * Get resume stats
 */
ResumeSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalResumes: { $sum: 1 },
        draftResumes: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
        },
        completeResumes: {
          $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] },
        },
        totalAICredits: { $sum: '$aiCreditsUsed' },
      },
    },
  ]);

  return stats[0] || {
    totalResumes: 0,
    draftResumes: 0,
    completeResumes: 0,
    totalAICredits: 0,
  };
};

/**
 * Pre-save middleware
 */
ResumeSchema.pre('save', function(next) {
  if (this.isModified('lastModified')) {
    this.lastModified = new Date();
  }
  next();
});

const Resume = mongoose.model('Resume', ResumeSchema);

module.exports = Resume;
