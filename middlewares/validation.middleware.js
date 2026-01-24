/**
 * Request Validation Middleware
 * Validates incoming requests using Joi schemas
 */

const Joi = require('joi');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/error');

/**
 * Validation schemas
 */
const validationSchemas = {
  // Auth schemas
  authRegister: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
        'any.required': 'Password is required',
      }),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
  }),

  authLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  authRefresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  authForgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  authResetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required(),
  }),

  authChangePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required(),
  }),

  authVerify2FA: Joi.object({
    code: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  // Resume schemas
  resumeCreate: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null),
    location: Joi.string().max(200).allow('', null),
    website: Joi.string().uri().allow('', null),
    linkedIn: Joi.string().uri().allow('', null),
    github: Joi.string().uri().allow('', null),
    summary: Joi.string().max(2000).allow('', null),
  }),

  resumeUpdate: Joi.object({
    title: Joi.string().min(3).max(200),
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    phone: Joi.string().allow('', null),
    location: Joi.string().max(200).allow('', null),
    website: Joi.string().uri().allow('', null),
    linkedIn: Joi.string().uri().allow('', null),
    github: Joi.string().uri().allow('', null),
    summary: Joi.string().max(2000).allow('', null),
  }),

  resumePatch: Joi.object().pattern(
    Joi.string(),
    Joi.any()
  ),

  // Work Experience
  experienceCreate: Joi.object({
    company: Joi.string().min(2).max(200).required(),
    position: Joi.string().min(2).max(200).required(),
    location: Joi.string().max(200).allow('', null),
    startDate: Joi.date().required(),
    endDate: Joi.date().allow(null),
    isCurrentPosition: Joi.boolean().default(false),
    description: Joi.string().max(5000).allow('', null),
    achievements: Joi.array().items(Joi.string().max(1000)),
    skillsUsed: Joi.array().items(Joi.string().max(100)),
    employmentType: Joi.string()
      .valid('full-time', 'part-time', 'contract', 'internship', 'freelance', 'other')
      .default('full-time'),
  }),

  // Education
  educationCreate: Joi.object({
    institution: Joi.string().min(2).max(200).required(),
    degree: Joi.string().min(2).max(200).required(),
    field: Joi.string().max(200).allow('', null),
    location: Joi.string().max(200).allow('', null),
    startDate: Joi.date().required(),
    endDate: Joi.date().allow(null),
    gpa: Joi.string().allow('', null),
    honors: Joi.array().items(Joi.string().max(200)),
    coursework: Joi.array().items(Joi.string().max(200)),
  }),

  // Skills
  skillsCreate: Joi.object({
    skills: Joi.array().items(
      Joi.object({
        name: Joi.string().min(1).max(100).required(),
        category: Joi.string()
          .valid('technical', 'soft', 'language', 'tool', 'framework', 'database', 'other')
          .default('technical'),
        proficiency: Joi.string()
          .valid('beginner', 'intermediate', 'advanced', 'expert', 'native')
          .default('intermediate'),
        yearsOfExperience: Joi.number().min(0).max(50).default(0),
      })
    ).min(1).required(),
  }),

  // Projects
  projectCreate: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().min(10).max(3000).required(),
    role: Joi.string().max(200).allow('', null),
    startDate: Joi.date().required(),
    endDate: Joi.date().allow(null),
    isOngoing: Joi.boolean().default(false),
    technologies: Joi.array().items(Joi.string().max(100)),
    achievements: Joi.array().items(Joi.string().max(500)),
    links: Joi.object({
      github: Joi.string().uri().allow('', null),
      live: Joi.string().uri().allow('', null),
      demo: Joi.string().uri().allow('', null),
    }),
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().allow('', null),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // AI Features
  resumeOptimize: Joi.object({
    targetRole: Joi.string().min(3).max(200).required(),
    industry: Joi.string().max(100).allow('', null),
    experienceLevel: Joi.string()
      .valid('entry', 'mid', 'senior', 'lead', 'executive')
      .required(),
    options: Joi.object({
      improveSummary: Joi.boolean().default(true),
      enhanceAchievements: Joi.boolean().default(true),
      optimizeKeywords: Joi.boolean().default(true),
    }).default(),
  }),

  atsScore: Joi.object({
    jobDescription: Joi.string().min(50).required(),
    jobTitle: Joi.string().max(200).allow('', null),
    requiredSkills: Joi.array().items(Joi.string()),
  }),

  careerObjective: Joi.object({
    techStack: Joi.array().items(Joi.string()).required(),
    experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead').required(),
    targetRole: Joi.string().min(3).max(200).required(),
    industry: Joi.string().max(100).allow('', null),
    companyType: Joi.string().max(100).allow('', null),
    leadershipGoals: Joi.boolean().default(false),
  }),

  // Export
  resumeExport: Joi.object({
    format: Joi.string().valid('pdf', 'docx').default('pdf'),
    quality: Joi.string().valid('standard', 'high', 'premium').default('high'),
    options: Joi.object({
      includePageNumbers: Joi.boolean().default(true),
      watermark: Joi.boolean().default(false),
    }).default(),
  }),

  // Share
  createShareLink: Joi.object({
    expiresIn: Joi.number().integer().min(60).max(7776000).default(604800), // 1 min to 90 days
    allowDownload: Joi.boolean().default(true),
    password: Joi.string().min(4).max(50).allow(null),
  }),
};

/**
 * Validation middleware factory
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = validationSchemas[schemaName];

    if (!schema) {
      logger.warn(`Validation schema not found: ${schemaName}`);
      return next();
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.debug('Validation failed:', {
        schema: schemaName,
        errors,
        body: req.body,
      });

      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
        timestamp: new Date().toISOString(),
      });
    }

    // Replace req.body with validated and sanitized values
    req.body = value;

    next();
  };
};

/**
 * Query parameter validation
 */
const validateQuery = (schemaName) => {
  return (req, res, next) => {
    const schema = validationSchemas[schemaName];

    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
        timestamp: new Date().toISOString(),
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Route parameter validation
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(422).json({
        success: false,
        message: 'Invalid parameters',
        code: 'VALIDATION_ERROR',
        errors,
        timestamp: new Date().toISOString(),
      });
    }

    req.params = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const commonSchemas = {
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),

  mongoId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid MongoDB ID format',
    }),

  email: Joi.string().email().messages({
    'string.email': 'Invalid email format',
  }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .messages({
      'string.pattern.base': 'Invalid phone number format',
    }),

  url: Joi.string().uri().messages({
    'string.uri': 'Invalid URL format',
  }),

  date: Joi.date().iso().messages({
    'date.format': 'Invalid date format',
  }),

  boolean: Joi.boolean().messages({
    'boolean.base': 'Must be a boolean value',
  }),
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  validationSchemas,
  commonSchemas,
};
