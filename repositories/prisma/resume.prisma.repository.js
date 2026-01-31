/**
 * Prisma Resume Repository
 * Resume data access layer using Prisma ORM
 */

const { prisma } = require('../../config/prisma.config');
const { NotFoundError, ForbiddenError } = require('../../utils/error');
const logger = require('../../utils/logger');

class ResumeRepository {
  /**
   * Find resume by ID
   */
  async findById(id) {
    try {
      const resume = await prisma.resume.findUnique({
        where: { id },
      });

      return resume;
    } catch (error) {
      logger.error('Error finding resume by ID:', error);
      throw error;
    }
  }

  /**
   * Find resume by ID and owner
   */
  async findByIdAndOwner(id, userId) {
    try {
      const resume = await prisma.resume.findFirst({
        where: {
          id,
          userId,
        },
      });

      return resume;
    } catch (error) {
      logger.error('Error finding resume by ID and owner:', error);
      throw error;
    }
  }

  /**
   * Find resume by share token
   */
  async findByShareToken(token) {
    try {
      const resume = await prisma.resume.findFirst({
        where: {
          shareToken: token,
          isShared: true,
          OR: [
            { shareExpiresAt: null },
            { shareExpiresAt: { gt: new Date() } },
          ],
        },
      });

      return resume;
    } catch (error) {
      logger.error('Error finding resume by share token:', error);
      throw error;
    }
  }

  /**
   * Find resumes by user ID
   */
  async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (status) where.status = status;

      const [resumes, total] = await Promise.all([
        prisma.resume.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.resume.count({ where }),
      ]);

      return {
        resumes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding resumes by user ID:', error);
      throw error;
    }
  }

  /**
   * Create new resume
   */
  async createResume(resumeData) {
    try {
      const resume = await prisma.resume.create({
        data: {
          ...resumeData,
          workExperience: resumeData.workExperience || [],
          education: resumeData.education || [],
          skills: resumeData.skills || [],
          projects: resumeData.projects || [],
          certifications: resumeData.certifications || [],
          languages: resumeData.languages || [],
          interests: resumeData.interests || [],
          customSections: resumeData.customSections || [],
        },
      });

      // Increment user resume count
      await prisma.user.update({
        where: { id: resumeData.userId },
        data: { resumesCreated: { increment: 1 } },
      });

      logger.info('Resume created', { resumeId: resume.id, userId: resumeData.userId });
      return resume;
    } catch (error) {
      logger.error('Error creating resume:', error);
      throw error;
    }
  }

  /**
   * Update resume
   */
  async updateResume(id, userId, updateData) {
    try {
      const resume = await prisma.resume.update({
        where: {
          id,
          userId,
        },
        data: updateData,
      });

      logger.info('Resume updated', { resumeId: id });
      return resume;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Resume not found');
      }
      logger.error('Error updating resume:', error);
      throw error;
    }
  }

  /**
   * Patch resume (partial update)
   */
  async patchResume(id, userId, updateData) {
    try {
      const resume = await prisma.resume.update({
        where: {
          id,
          userId,
        },
        data: updateData,
      });

      logger.info('Resume patched', { resumeId: id });
      return resume;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Resume not found');
      }
      logger.error('Error patching resume:', error);
      throw error;
    }
  }

  /**
   * Delete resume
   */
  async deleteResume(id, userId) {
    try {
      await prisma.resume.delete({
        where: {
          id,
          userId,
        },
      });

      logger.info('Resume deleted', { resumeId: id });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Resume not found');
      }
      logger.error('Error deleting resume:', error);
      throw error;
    }
  }

  /**
   * Duplicate resume
   */
  async duplicateResume(id, userId) {
    try {
      const original = await this.findById(id);

      if (!original) {
        throw new NotFoundError('Resume not found');
      }

      if (original.userId !== userId) {
        throw new ForbiddenError('You can only duplicate your own resumes');
      }

      const duplicate = await prisma.resume.create({
        data: {
          userId: original.userId,
          templateId: original.templateId,
          title: `${original.title} (Copy)`,
          slug: `${original.slug}-copy-${Date.now()}`,
          targetJobTitle: original.targetJobTitle,
          summary: original.summary,
          workExperience: original.workExperience,
          education: original.education,
          skills: original.skills,
          projects: original.projects,
          certifications: original.certifications,
          languages: original.languages,
          interests: original.interests,
          customSections: original.customSections,
          sectionOrder: original.sectionOrder,
          hiddenSections: original.hiddenSections,
          styling: original.styling,
        },
      });

      logger.info('Resume duplicated', {
        originalId: id,
        duplicateId: duplicate.id
      });

      return duplicate;
    } catch (error) {
      logger.error('Error duplicating resume:', error);
      throw error;
    }
  }

  /**
   * Change resume template
   */
  async changeTemplate(id, userId, templateId) {
    try {
      const resume = await prisma.resume.update({
        where: {
          id,
          userId,
        },
        data: { templateId },
      });

      logger.info('Resume template changed', { resumeId: id, templateId });
      return resume;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Resume not found');
      }
      logger.error('Error changing resume template:', error);
      throw error;
    }
  }

  /**
   * Generate share token
   */
  async generateShareToken(id, userId) {
    try {
      const crypto = require('crypto');
      const shareToken = crypto.randomBytes(32).toString('hex');

      const resume = await prisma.resume.update({
        where: {
          id,
          userId,
        },
        data: {
          shareToken,
          isShared: true,
        },
      });

      logger.info('Share token generated', { resumeId: id });
      return resume;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Resume not found');
      }
      logger.error('Error generating share token:', error);
      throw error;
    }
  }

  /**
   * Revoke share token
   */
  async revokeShareToken(id, userId) {
    try {
      const resume = await prisma.resume.update({
        where: {
          id,
          userId,
        },
        data: {
          shareToken: null,
          isShared: false,
        },
      });

      logger.info('Share token revoked', { resumeId: id });
      return resume;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Resume not found');
      }
      logger.error('Error revoking share token:', error);
      throw error;
    }
  }

  /**
   * Get user resume stats
   */
  async getUserResumeStats(userId) {
    try {
      const [total, draft, complete] = await Promise.all([
        prisma.resume.count({ where: { userId } }),
        prisma.resume.count({
          where: { userId, status: 'DRAFT' }
        }),
        prisma.resume.count({
          where: { userId, status: 'COMPLETE' }
        }),
      ]);

      return { total, draft, complete };
    } catch (error) {
      logger.error('Error getting user resume stats:', error);
      throw error;
    }
  }

  /**
   * Search resumes
   */
  async search(query, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      // Prisma MongoDB doesn't support full-text search natively
      // Use regex for basic search
      const resumes = await prisma.resume.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { targetJobTitle: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      return resumes;
    } catch (error) {
      logger.error('Error searching resumes:', error);
      throw error;
    }
  }

  /**
   * Update ATS analysis
   */
  async updateATSAnalysis(id, userId, analysisData) {
    try {
      const resume = await prisma.resume.update({
        where: {
          id,
          userId,
        },
        data: {
          atsAnalysis: analysisData,
        },
      });

      return resume;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Resume not found');
      }
      logger.error('Error updating ATS analysis:', error);
      throw error;
    }
  }

  /**
   * Increment AI usage for resume
   */
  async incrementAIUsage(id, userId) {
    try {
      const resume = await prisma.resume.update({
        where: {
          id,
          userId,
        },
        data: {
          aiCreditsUsed: { increment: 1 },
        },
      });

      return resume;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Resume not found');
      }
      logger.error('Error incrementing AI usage:', error);
      throw error;
    }
  }

  /**
   * Get recent resumes
   */
  async getRecentResumes(limit = 10) {
    try {
      const resumes = await prisma.resume.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      });

      return resumes;
    } catch (error) {
      logger.error('Error getting recent resumes:', error);
      throw error;
    }
  }

  /**
   * Count resumes by status
   */
  async countByStatus(status) {
    try {
      const count = await prisma.resume.count({
        where: { status },
      });

      return count;
    } catch (error) {
      logger.error('Error counting resumes by status:', error);
      throw error;
    }
  }
}

module.exports = new ResumeRepository();
