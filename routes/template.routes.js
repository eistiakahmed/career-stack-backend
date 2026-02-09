/**
 * Template Routes
 * Resume template endpoints
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');

/**
 * @route   GET /templates
 * @desc    Get all templates
 * @access  Public
 */
router.get('/', optionalAuth, rateLimit.general, templateController.getTemplates);

/**
 * @route   GET /templates/featured
 * @desc    Get featured templates
 * @access  Public
 */
router.get('/featured', templateController.getFeaturedTemplates);

/**
 * @route   GET /templates/categories
 * @desc    Get template categories
 * @access  Public
 */
router.get('/categories', templateController.getCategories);

/**
 * @route   GET /templates/:templateId
 * @desc    Get template by ID
 * @access  Public
 */
router.get('/:templateId', templateController.getTemplate);

/**
 * @route   GET /templates/:templateId/preview
 * @desc    Get template preview
 * @access  Public
 */
router.get('/:templateId/preview', templateController.getTemplatePreview);

module.exports = router;
