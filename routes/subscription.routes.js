/**
 * Subscription Routes
 * Subscription and payment endpoints
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/rbac.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');
const { validate } = require('../middlewares/validation.middleware');

/**
 * @route   GET /subscription/plans
 * @desc    Get available subscription plans
 * @access  Public
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @route   GET /subscription/current
 * @desc    Get current subscription
 * @access  Private
 */
router.get('/current', authenticate, subscriptionController.getCurrentSubscription);

/**
 * @route   POST /subscription/create
 * @desc    Create new subscription
 * @access  Private
 */
router.post(
  '/create',
  authenticate,
  rateLimit.general,
  validate('subscriptionCreate'),
  subscriptionController.createSubscription
);

/**
 * @route   PUT /subscription/update
 * @desc    Update subscription plan
 * @access  Private
 */
router.put(
  '/update',
  authenticate,
  validate('subscriptionUpdate'),
  subscriptionController.updateSubscription
);

/**
 * @route   POST /subscription/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);

/**
 * @route   POST /subscription/resume
 * @desc    Resume canceled subscription
 * @access  Private
 */
router.post('/resume', authenticate, subscriptionController.resumeSubscription);

/**
 * @route   GET /subscription/history
 * @desc    Get payment history
 * @access  Private
 */
router.get('/history', authenticate, subscriptionController.getPaymentHistory);

/**
 * @route   GET /subscription/invoices
 * @desc    Get invoices
 * @access  Private
 */
router.get('/invoices', authenticate, subscriptionController.getInvoices);

/**
 * @route   GET /subscription/usage
 * @desc    Get current usage
 * @access  Private
 */
router.get('/usage', authenticate, subscriptionController.getUsage);

/**
 * @route   POST /subscription/portal
 * @desc    Create customer portal session
 * @access  Private
 */
router.post('/portal', authenticate, subscriptionController.createPortalSession);

/**
 * @route   POST /subscription/webhook
 * @desc    Stripe webhook handler
 * @access  Public (authenticated by Stripe)
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.webhook
);

module.exports = router;
