/**
 * Admin Routes
 * Admin panel endpoints
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin, hasPermission } = require('../middlewares/rbac.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');

/**
 * @route   GET /admin/dashboard
 * @desc    Get admin dashboard stats
 * @access  Admin
 */
router.get('/dashboard', authenticate, isAdmin, adminController.getDashboardStats);

/**
 * @route   GET /admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get('/users', authenticate, isAdmin, adminController.getUsers);

/**
 * @route   GET /admin/users/:userId
 * @desc    Get user details
 * @access  Admin
 */
router.get('/users/:userId', authenticate, isAdmin, adminController.getUserDetails);

/**
 * @route   PUT /admin/users/:userId
 * @desc    Update user
 * @access  Admin
 */
router.put('/users/:userId', authenticate, isAdmin, adminController.updateUser);

/**
 * @route   DELETE /admin/users/:userId
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/users/:userId', authenticate, isAdmin, adminController.deleteUser);

/**
 * @route   PUT /admin/users/:userId/suspend
 * @desc    Suspend user
 * @access  Admin
 */
router.put('/users/:userId/suspend', authenticate, isAdmin, adminController.suspendUser);

/**
 * @route   PUT /admin/users/:userId/activate
 * @desc    Activate user
 * @access  Admin
 */
router.put('/users/:userId/activate', authenticate, isAdmin, adminController.activateUser);

/**
 * @route   GET /admin/subscriptions
 * @desc    Get all subscriptions
 * @access  Admin
 */
router.get(
  '/subscriptions',
  authenticate,
  isAdmin,
  adminController.getSubscriptions
);

/**
 * @route   GET /admin/analytics
 * @desc    Get platform analytics
 * @access  Admin
 */
router.get('/analytics', authenticate, isAdmin, adminController.getAnalytics);

/**
 * @route   GET /admin/reports
 * @desc    Get reports
 * @access  Admin
 */
router.get('/reports', authenticate, isAdmin, adminController.getReports);

/**
 * @route   GET /admin/settings
 * @desc    Get platform settings
 * @access  Admin
 */
router.get('/settings', authenticate, isAdmin, adminController.getSettings);

/**
 * @route   PUT /admin/settings
 * @desc    Update platform settings
 * @access  Admin
 */
router.put('/settings', authenticate, isAdmin, adminController.updateSettings);

/**
 * @route   POST /admin/templates
 * @desc    Create template
 * @access  Admin
 */
router.post('/templates', authenticate, isAdmin, adminController.createTemplate);

/**
 * @route   PUT /admin/templates/:templateId
 * @desc    Update template
 * @access  Admin
 */
router.put('/templates/:templateId', authenticate, isAdmin, adminController.updateTemplate);

/**
 * @route   DELETE /admin/templates/:templateId
 * @desc    Delete template
 * @access  Admin
 */
router.delete('/templates/:templateId', authenticate, isAdmin, adminController.deleteTemplate);

module.exports = router;
