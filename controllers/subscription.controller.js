/**
 * Subscription Controller
 * Handles subscription and payment requests
 */

const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const { successResponse } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const { BadRequestError, NotFoundError } = require('../utils/error');
const logger = require('../utils/logger');
const config = require('../config/env.config');
const { PLANS } = require('../utils/constants');

class SubscriptionController {
  /**
   * Get available subscription plans
   */
  getPlans = asyncHandler(async (req, res) => {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          '3 Resumes',
          '5 AI Credits',
          'Basic Templates',
          'Standard Export',
        ],
        limits: {
          maxResumes: 3,
          aiCredits: 5,
        },
      },
      {
        id: 'pro_monthly',
        name: 'Pro Monthly',
        price: 19,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited Resumes',
          'Unlimited AI Credits',
          'All Templates',
          'High-Quality Export',
          'Public Portfolio',
          'Priority Support',
        ],
        limits: {
          maxResumes: -1,
          aiCredits: -1,
        },
      },
      {
        id: 'pro_yearly',
        name: 'Pro Yearly',
        price: 190,
        currency: 'USD',
        interval: 'year',
        savings: 38,
        features: [
          'Unlimited Resumes',
          'Unlimited AI Credits',
          'All Templates',
          'High-Quality Export',
          'Public Portfolio',
          'Priority Support',
          '2 Months Free',
        ],
        limits: {
          maxResumes: -1,
          aiCredits: -1,
        },
      },
    ];

    return successResponse(res, { plans }, 'Plans retrieved successfully');
  });

  /**
   * Get current subscription
   */
  getCurrentSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const subscription = await Subscription.findActiveByUserId(userId);
    const user = await User.findById(userId);

    const result = {
      subscription,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      usage: user.getUsageStats(),
    };

    return successResponse(res, result, 'Subscription retrieved successfully');
  });

  /**
   * Create new subscription
   */
  createSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { planId, paymentMethodId } = req.body;

    // Stripe integration would go here
    // For now, return a mock response

    const stripe = require('stripe')(config.stripe.secretKey);

    const user = await User.findById(userId);

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      customerId = customer.id;
    }

    // Get price ID from plan
    const priceMap = {
      pro_monthly: 'price_pro_monthly_id',
      pro_yearly: 'price_pro_yearly_id',
    };

    const priceId = priceMap[planId];
    if (!priceId) {
      throw new BadRequestError('Invalid plan');
    }

    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Save subscription to database
    const subscription = await Subscription.createFromStripe(stripeSubscription);

    // Update user
    await User.findByIdAndUpdate(userId, {
      subscriptionTier: 'pro',
      subscriptionId: subscription._id,
      stripeCustomerId: customerId,
    });

    const result = {
      subscription,
      clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret,
    };

    return successResponse(res, result, 'Subscription created successfully', 201);
  });

  /**
   * Update subscription plan
   */
  updateSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { newPlanId } = req.body;

    // Stripe update would go here
    const result = {
      subscriptionId: 'sub_123',
      newPlan: newPlanId,
      effectiveDate: new Date(),
    };

    return successResponse(res, result, 'Subscription updated successfully');
  });

  /**
   * Cancel subscription
   */
  cancelSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { immediate = false } = req.body;

    // Stripe cancellation would go here
    const result = {
      canceled: true,
      immediate,
      effectiveDate: immediate
        ? new Date()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    return successResponse(res, result, 'Subscription canceled successfully');
  });

  /**
   * Resume subscription
   */
  resumeSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Stripe resume would go here
    const result = {
      resumed: true,
      effectiveDate: new Date(),
    };

    return successResponse(res, result, 'Subscription resumed successfully');
  });

  /**
   * Get payment history
   */
  getPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { page, limit } = req.query;

    // Payment history retrieval would go here
    const result = {
      payments: [
        {
          id: 'pi_123',
          date: new Date(),
          amount: 19,
          currency: 'USD',
          status: 'succeeded',
          description: 'Pro Monthly Subscription',
        },
      ],
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        total: 1,
      },
    };

    return successResponse(res, result, 'Payment history retrieved successfully');
  });

  /**
   * Get invoices
   */
  getInvoices = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Invoice retrieval would go here
    const result = {
      invoices: [
        {
          id: 'in_123',
          date: new Date(),
          amount: 19,
          currency: 'USD',
          status: 'paid',
          downloadUrl: 'https://stripe.com/invoice/pdf',
        },
      ],
    };

    return successResponse(res, result, 'Invoices retrieved successfully');
  });

  /**
   * Get current usage
   */
  getUsage = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const usage = user.getUsageStats();

    return successResponse(res, usage, 'Usage retrieved successfully');
  });

  /**
   * Create customer portal session
   */
  createPortalSession = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { returnUrl } = req.body;

    const stripe = require('stripe')(config.stripe.secretKey);
    const user = await User.findById(userId);

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || `${config.clientUrl.production}/settings/subscription`,
    });

    return successResponse(res, { url: session.url }, 'Portal session created');
  });

  /**
   * Stripe webhook handler
   */
  webhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const stripe = require('stripe')(config.stripe.secretKey);

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        config.stripe.webhookSecret
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  });

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(subscription) {
    logger.info('Subscription created:', subscription.id);
    // Update database
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    logger.info('Subscription updated:', subscription.id);
    // Update database
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription) {
    logger.info('Subscription deleted:', subscription.id);
    // Update database
  }

  /**
   * Handle payment succeeded
   */
  async handlePaymentSucceeded(invoice) {
    logger.info('Payment succeeded:', invoice.id);
    // Send invoice, update usage
  }

  /**
   * Handle payment failed
   */
  async handlePaymentFailed(invoice) {
    logger.info('Payment failed:', invoice.id);
    // Send notification, handle retry
  }
}

module.exports = new SubscriptionController();
