/**
 * Main API Routes Index
 * Consolidates all route modules
 */

const express = require('express');
const router = express.Router();
const config = require('../config/env.config');

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const resumeRoutes = require('./resume.routes');
const templateRoutes = require('./template.routes');
const aiRoutes = require('./ai.routes');
const subscriptionRoutes = require('./subscription.routes');
const portfolioRoutes = require('./portfolio.routes');
const adminRoutes = require('./admin.routes');
const healthRoutes = require('./health.routes');

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Resume Builder API',
    version: config.apiVersion,
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      resumes: '/api/resumes',
      templates: '/api/templates',
      ai: '/api/ai',
      subscription: '/api/subscription',
      portfolio: '/api/portfolio',
      admin: '/api/admin',
      health: '/api/health',
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/resumes', resumeRoutes);
router.use('/templates', templateRoutes);
router.use('/ai', aiRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

module.exports = router;
