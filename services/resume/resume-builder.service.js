/**
 * Resume Builder Service
 * Core business logic for resume creation and management
 */

const resumeRepository = require('../../repositories/resume.repository');
const userRepository = require('../../repositories/user.repository');
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} = require('../../utils/error');
const logger = require('../../utils/logger');
const redis = require('../../config/redis.config');

class ResumeBuilderService {
  /**
   * Create a new resume
   */
  async createResume(userId, resumeData) {
    try {
      const resume = await resumeRepository.createResume(userId, resumeData);

      logger.info('Resume created', {
        resumeId: resume._id,
        userId,
      });

      return resume;
    } catch (error) {
      logger.error('Create resume error:', error);
      throw error;
    }
  }

  /**
   * Get resume by ID
   */
  async getResume(resumeId, userId) {
    try {
      const resume = await resumeRepository.findByIdAndOwner(resumeId, userId);
      return resume;
    } catch (error) {
      logger.error('Get resume error:', error);
      throw error;
    }
  }

  /**
   * Get all resumes for user
   */
  async getUserResumes(userId, options = {}) {
    try {
      return await resumeRepository.findByUserId(userId, options);
    } catch (error) {
      logger.error('Get user resumes error:', error);
      throw error;
    }
  }

  /**
   * Update resume
   */
  async updateResume(resumeId, userId, updateData) {
    try {
      const resume = await resumeRepository.updateResume(
        resumeId,
        userId,
        updateData
      );

      // Clear cache
      await redis.cacheDelete(`resume:${resumeId}`);

      logger.info('Resume updated', {
        resumeId,
        userId,
      });

      return resume;
    } catch (error) {
      logger.error('Update resume error:', error);
      throw error;
    }
  }

  /**
   * Patch resume (for autosave)
   */
  async patchResume(resumeId, userId, patchData) {
    try {
      const resume = await resumeRepository.patchResume(
        resumeId,
        userId,
        patchData
      );

      // Clear cache
      await redis.cacheDelete(`resume:${resumeId}`);

      return resume;
    } catch (error) {
      logger.error('Patch resume error:', error);
      throw error;
    }
  }

  /**
   * Delete resume
   */
  async deleteResume(resumeId, userId) {
    try {
      const resume = await resumeRepository.deleteResume(resumeId, userId);

      // Clear cache
      await redis.cacheDelete(`resume:${resumeId}`);

      logger.info('Resume deleted', {
        resumeId,
        userId,
      });

      return resume;
    } catch (error) {
      logger.error('Delete resume error:', error);
      throw error;
    }
  }

  /**
   * Duplicate resume
   */
  async duplicateResume(resumeId, userId) {
    try {
      const newResume = await resumeRepository.duplicateResume(resumeId, userId);

      logger.info('Resume duplicated', {
        originalResumeId: resumeId,
        newResumeId: newResume._id,
        userId,
      });

      return newResume;
    } catch (error) {
      logger.error('Duplicate resume error:', error);
      throw error;
    }
  }

  /**
   * Change resume template
   */
  async changeTemplate(resumeId, userId, templateId, customizations = {}) {
    try {
      const resume = await resumeRepository.changeTemplate(
        resumeId,
        userId,
        templateId,
        customizations
      );

      // Clear cache
      await redis.cacheDelete(`resume:${resumeId}`);

      logger.info('Resume template changed', {
        resumeId,
        templateId,
        userId,
      });

      return resume;
    } catch (error) {
      logger.error('Change template error:', error);
      throw error;
    }
  }

  /**
   * Reorder sections
   */
  async reorderSections(resumeId, userId, newOrder) {
    try {
      const resume = await resumeRepository.findByIdAndOwner(resumeId, userId);

      await resume.reorderSections(newOrder);

      // Clear cache
      await redis.cacheDelete(`resume:${resumeId}`);

      return resume;
    } catch (error) {
      logger.error('Reorder sections error:', error);
      throw error;
    }
  }

  /**
   * Toggle section visibility
   */
  async toggleSection(resumeId, userId, sectionName) {
    try {
      const resume = await resumeRepository.findByIdAndOwner(resumeId, userId);

      await resume.toggleSection(sectionName);

      // Clear cache
      await redis.cacheDelete(`resume:${resumeId}`);

      return resume;
    } catch (error) {
      logger.error('Toggle section error:', error);
      throw error;
    }
  }

  /**
   * Get resume statistics
   */
  async getResumeStats(userId) {
    try {
      return await resumeRepository.getResumeStats(userId);
    } catch (error) {
      logger.error('Get resume stats error:', error);
      throw error;
    }
  }

  /**
   * Search public resumes
   */
  async searchPublicResumes(query, options = {}) {
    try {
      return await resumeRepository.searchPublicResumes(query, options);
    } catch (error) {
      logger.error('Search public resumes error:', error);
      throw error;
    }
  }

  /**
   * Get featured resumes
   */
  async getFeaturedResumes(limit = 10) {
    try {
      return await resumeRepository.getFeaturedResumes(limit);
    } catch (error) {
      logger.error('Get featured resumes error:', error);
      throw error;
    }
  }

  /**
   * Create share link
   */
  async createShareLink(resumeId, userId) {
    try {
      const resume = await resumeRepository.createShareLink(resumeId, userId);

      logger.info('Share link created', {
        resumeId,
        userId,
      });

      return {
        shareUrl: `${config.clientUrl.production}/r/${resume.shareToken}`,
        shareToken: resume.shareToken,
      };
    } catch (error) {
      logger.error('Create share link error:', error);
      throw error;
    }
  }

  /**
   * Revoke share link
   */
  async revokeShareLink(resumeId, userId) {
    try {
      const resume = await resumeRepository.revokeShareLink(resumeId, userId);

      // Clear cache
      await redis.cacheDelete(`resume:${resumeId}`);

      logger.info('Share link revoked', {
        resumeId,
        userId,
      });

      return { success: true };
    } catch (error) {
      logger.error('Revoke share link error:', error);
      throw error;
    }
  }

  /**
   * View shared resume
   */
  async viewSharedResume(shareToken) {
    try {
      const resume = await resumeRepository.findByShareToken(shareToken);

      if (!resume) {
        throw new NotFoundError('Shared resume not found or has been removed');
      }

      // Increment view count (in background)
      resume.views = (resume.views || 0) + 1;
      resume.save().catch((err) => logger.error('Error incrementing views:', err));

      return resume;
    } catch (error) {
      logger.error('View shared resume error:', error);
      throw error;
    }
  }

  /**
   * Get resume with ATS analysis
   */
  async getResumeWithATSAnalysis(resumeId, userId) {
    try {
      const resume = await resumeRepository.findByIdAndOwner(resumeId, userId);

      return {
        resume,
        atsAnalysis: resume.atsAnalysis,
      };
    } catch (error) {
      logger.error('Get resume with ATS error:', error);
      throw error;
    }
  }
}

module.exports = new ResumeBuilderService();
