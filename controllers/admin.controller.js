/**
 * Admin Controller
 * Handles admin panel requests
 */

const userRepository = require('../repositories/user.repository');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const { successResponse, paginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

class AdminController {
  /**
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalResumes,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      require('../models/resume.model').countDocuments(),
    ]);

    // Get recent activity
    const { Event } = require('../models/analytics.model');
    const recentEvents = await Event.find({})
      .sort({ timestamp: -1 })
      .limit(10);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        growth: 0, // Would calculate from previous period
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        revenue: 0, // Would calculate from Stripe
      },
      resumes: {
        total: totalResumes,
        createdThisMonth: 0, // Would calculate from analytics
      },
      recentActivity: recentEvents,
    };

    return successResponse(res, stats, 'Dashboard stats retrieved successfully');
  });

  /**
   * Get all users
   */
  getUsers = asyncHandler(async (req, res) => {
    const { page, limit, search, status, tier } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (tier) filter.subscriptionTier = tier;

    let query = User.find(filter);

    if (search) {
      query = query.where({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      query
        .select('-password -twoFactorSecret -twoFactorBackupCodes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      users,
      {
        page: pageNum,
        limit: limitNum,
        total,
      },
      'Users retrieved successfully'
    );
  });

  /**
   * Get user details
   */
  getUserDetails = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const subscription = await Subscription.findActiveByUserId(userId);
    const stats = user.getUsageStats();

    return successResponse(
      res,
      { user, subscription, stats },
      'User details retrieved successfully'
    );
  });

  /**
   * Update user
   */
  updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const updateData = req.body;

    const user = await userRepository.updateProfile(userId, updateData);

    return successResponse(res, { user }, 'User updated successfully');
  });

  /**
   * Delete user
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    await User.findByIdAndUpdate(userId, { status: 'deleted' });

    logger.info('User deleted by admin', { userId, adminId: req.user.userId });

    return successResponse(res, {}, 'User deleted successfully');
  });

  /**
   * Suspend user
   */
  suspendUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    await userRepository.suspendUser(userId);

    logger.info('User suspended by admin', { userId, reason, adminId: req.user.userId });

    return successResponse(res, {}, 'User suspended successfully');
  });

  /**
   * Activate user
   */
  activateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    await User.findByIdAndUpdate(userId, { status: 'active' });

    logger.info('User activated by admin', { userId, adminId: req.user.userId });

    return successResponse(res, {}, 'User activated successfully');
  });

  /**
   * Get all subscriptions
   */
  getSubscriptions = asyncHandler(async (req, res) => {
    const { page, limit, status, tier } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (tier) filter.tier = tier;

    const subscriptions = await Subscription.find(filter)
      .populate('userId')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(filter);

    return paginatedResponse(
      res,
      subscriptions,
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        total,
      },
      'Subscriptions retrieved successfully'
    );
  });

  /**
   * Get platform analytics
   */
  getAnalytics = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const { Analytics, Event } = require('../models/analytics.model');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const summary = await Analytics.getUserSummary(null, parseInt(days));

    // Get top events
    const eventCounts = await Event.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const analytics = {
      summary,
      topEvents: eventCounts,
      period: `${days} days`,
    };

    return successResponse(res, analytics, 'Analytics retrieved successfully');
  });

  /**
   * Get reports
   */
  getReports = asyncHandler(async (req, res) => {
    const { type, startDate, endDate } = req.query;

    // Reports would be generated here
    const reports = {
      type,
      data: [],
      period: { startDate, endDate },
    };

    return successResponse(res, reports, 'Reports retrieved successfully');
  });

  /**
   * Get platform settings
   */
  getSettings = asyncHandler(async (req, res) => {
    const settings = {
      features: {
        aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
        publicPortfolio: process.env.ENABLE_PUBLIC_PORTFOLIO === 'true',
        templates: process.env.ENABLE_TEMPLATES === 'true',
        exportPdf: process.env.ENABLE_EXPORT_PDF === 'true',
      },
      limits: {
        freePlan: {
          maxResumes: process.env.FREE_PLAN_RESUMES,
          aiCredits: process.env.FREE_PLAN_AI_CREDITS,
        },
        proPlan: {
          maxResumes: process.env.PRO_PLAN_RESUMES,
          aiCredits: process.env.PRO_PLAN_AI_CREDITS,
        },
      },
    };

    return successResponse(res, settings, 'Settings retrieved successfully');
  });

  /**
   * Update platform settings
   */
  updateSettings = asyncHandler(async (req, res) => {
    const { features, limits } = req.body;

    // Settings would be updated here (might require restart)
    logger.info('Admin updated platform settings', { features, limits });

    return successResponse(res, {}, 'Settings updated successfully');
  });

  /**
   * Create template
   */
  createTemplate = asyncHandler(async (req, res) => {
    const templateData = req.body;

    const Template = require('../models/template.model');
    const template = await Template.create(templateData);

    return successResponse(res, { template }, 'Template created successfully', 201);
  });

  /**
   * Update template
   */
  updateTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    const updateData = req.body;

    const Template = require('../models/template.model');
    const template = await Template.findByIdAndUpdate(templateId, updateData, {
      new: true,
    });

    return successResponse(res, { template }, 'Template updated successfully');
  });

  /**
   * Delete template
   */
  deleteTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;

    const Template = require('../models/template.model');
    await Template.findByIdAndDelete(templateId);

    return successResponse(res, {}, 'Template deleted successfully');
  });
}

module.exports = new AdminController();
