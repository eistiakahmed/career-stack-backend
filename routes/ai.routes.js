/**
 * AI Routes
 * AI-powered resume optimization endpoints
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasPermission } = require('../middlewares/rbac.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');
const { validate } = require('../middlewares/validation.middleware');

/**
 * @route   POST /ai/optimize
 * @desc    AI optimize resume content
 * @access  Private (requires subscription)
 */
router.post(
  '/optimize',
  authenticate,
  hasPermission('AI_OPTIMIZE'),
  rateLimit.ai,
  validate('resumeOptimize'),
  aiController.optimizeResume
);

/**
 * @route   POST /ai/ats-score
 * @desc    Calculate ATS score
 * @access  Private (requires subscription)
 */
router.post(
  '/ats-score',
  authenticate,
  hasPermission('AI_ANALYZE'),
  rateLimit.ai,
  aiController.getATSScore
);

/**
 * @route   POST /ai/career-objective
 * @desc    Generate AI career objective
 * @access  Private (requires subscription)
 */
router.post(
  '/career-objective',
  authenticate,
  hasPermission('AI_GENERATE'),
  rateLimit.ai,
  aiController.generateCareerObjective
);

/**
 * @route   POST /ai/improve-content
 * @desc    Improve resume content with AI
 * @access  Private (requires subscription)
 */
router.post(
  '/improve-content',
  authenticate,
  hasPermission('AI_OPTIMIZE'),
  rateLimit.ai,
  aiController.improveContent
);

/**
 * @route   POST /ai/suggest-skills
 * @desc    Get AI skill suggestions
 * @access  Private (requires subscription)
 */
router.post(
  '/suggest-skills',
  authenticate,
  hasPermission('AI_ANALYZE'),
  rateLimit.ai,
  aiController.suggestSkills
);

/**
 * @route   POST /ai/analyze-job-description
 * @desc    Analyze job description and get insights
 * @access  Private (requires subscription)
 */
router.post(
  '/analyze-job-description',
  authenticate,
  hasPermission('AI_ANALYZE'),
  rateLimit.ai,
  aiController.analyzeJobDescription
);

/**
 * @route   POST /ai/generate-summary
 * @desc    Generate professional summary
 * @access  Private (requires subscription)
 */
router.post(
  '/generate-summary',
  authenticate,
  hasPermission('AI_GENERATE'),
  rateLimit.ai,
  aiController.generateSummary
);

/**
 * @route   POST /ai/enhance-achievement
 * @desc    Enhance achievement descriptions
 * @access  Private (requires subscription)
 */
router.post(
  '/enhance-achievement',
  authenticate,
  hasPermission('AI_OPTIMIZE'),
  rateLimit.ai,
  aiController.enhanceAchievement
);

/**
 * @route   GET /ai/usage
 * @desc    Get AI usage statistics
 * @access  Private
 */
router.get('/usage', authenticate, aiController.getAIUsage);

module.exports = router;
