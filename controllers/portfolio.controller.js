/**
 * Portfolio Controller
 * Handles public portfolio requests
 */

const userRepository = require('../repositories/user.repository');
const { successResponse } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const { NotFoundError, BadRequestError } = require('../utils/error');
const logger = require('../utils/logger');

class PortfolioController {
  /**
   * Get public portfolio
   */
  getPortfolio = asyncHandler(async (req, res) => {
    const { username } = req.params;

    const user = await userRepository.findByPortfolioUsername(username);

    if (!user || !user.portfolioEnabled) {
      throw new NotFoundError('Portfolio not found');
    }

    // Get user's resumes
    const resumeRepository = require('../repositories/resume.repository');
    const publicResumes = await resumeRepository.findAll({
      userId: user._id,
      isPublic: true,
      status: 'complete',
    });

    const portfolio = {
      username: user.portfolioUsername,
      displayName: user.displayName || user.fullName,
      bio: user.bio,
      avatar: user.avatar,
      location: user.location,
      socialLinks: user.socialLinks,
      resumes: publicResumes,
      skills: user.skills || [],
      projects: user.projects || [],
      contact: {
        email: user.portfolioEnabled ? user.email : null,
        linkedIn: user.socialLinks?.linkedIn || null,
        github: user.socialLinks?.github || null,
      },
    };

    return successResponse(res, portfolio, 'Portfolio retrieved successfully');
  });

  /**
   * Create/update portfolio
   */
  createPortfolio = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { username, displayName, bio, showResume, showProjects, showContact } = req.body;

    // Check if username is available
    if (username) {
      const existing = await userRepository.findByPortfolioUsername(username);
      if (existing && existing._id.toString() !== userId) {
        throw new BadRequestError('Username already taken');
      }
    }

    // Update user portfolio settings
    const user = await userRepository.setPortfolioUsername(userId, username);

    await userRepository.updateProfile(userId, {
      displayName: displayName || user.displayName,
      bio,
      portfolioEnabled: true,
    });

    return successResponse(res, {
      portfolioUrl: `${process.env.CLIENT_URL}/u/${username}`,
      username,
    }, 'Portfolio created successfully');
  });

  /**
   * Update portfolio settings
   */
  updatePortfolio = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const updateData = req.body;

    await userRepository.updateProfile(userId, updateData);

    return successResponse(res, {}, 'Portfolio updated successfully');
  });

  /**
   * Delete portfolio
   */
  deletePortfolio = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    await userRepository.updateProfile(userId, {
      portfolioUsername: null,
      portfolioEnabled: false,
    });

    return successResponse(res, {}, 'Portfolio deleted successfully');
  });

  /**
   * Get portfolio statistics
   */
  getPortfolioStats = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const user = await userRepository.findById(userId);

    // Get analytics for portfolio views
    const { Analytics } = require('../models/analytics.model');

    const stats = await Analytics.getUserSummary(userId, 30);

    return successResponse(res, {
      views: stats.portfolio.views,
      shares: stats.portfolio.shares,
      url: user.portfolioUsername
        ? `${process.env.CLIENT_URL}/u/${user.portfolioUsername}`
        : null,
    }, 'Portfolio statistics retrieved successfully');
  });
}

module.exports = new PortfolioController();
