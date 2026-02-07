/**
 * Health Routes
 * Health check and monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', healthController.healthCheck);

/**
 * @route   GET /health/readiness
 * @desc    Readiness probe (for Kubernetes)
 * @access  Public
 */
router.get('/readiness', healthController.readiness);

/**
 * @route   GET /health/liveness
 * @desc    Liveness probe (for Kubernetes)
 * @access  Public
 */
router.get('/liveness', healthController.liveness);

/**
 * @route   GET /health/status
 * @desc    Detailed status information
 * @access  Public
 */
router.get('/status', healthController.status);

module.exports = router;
