/**
 * Portfolio Routes
 * Public portfolio endpoints
 */

const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');

/**
 * @route   GET /portfolio/:username
 * @desc    Get public portfolio
 * @access  Public
 */
router.get(
  '/:username',
  optionalAuth,
  rateLimit.publicView,
  portfolioController.getPortfolio
);

/**
 * @route   POST /portfolio
 * @desc    Create/update portfolio
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate('portfolioCreate'),
  portfolioController.createPortfolio
);

/**
 * @route   PUT /portfolio
 * @desc    Update portfolio settings
 * @access  Private
 */
router.put('/', authenticate, portfolioController.updatePortfolio);

/**
 * @route   DELETE /portfolio
 * @desc    Delete portfolio
 * @access  Private
 */
router.delete('/', authenticate, portfolioController.deletePortfolio);

/**
 * @route   GET /portfolio/me/stats
 * @desc    Get portfolio statistics
 * @access  Private
 */
router.get('/me/stats', authenticate, portfolioController.getPortfolioStats);

module.exports = router;
