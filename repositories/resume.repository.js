/**
 * Resume Repository
 * Data access layer for Resume model
 */

const BaseRepository = require('./base.repository');
const Resume = require('../models/resume.model');
const { NotFoundError, ForbiddenError } = require('../utils/error');
const logger = require('../utils/logger');

class ResumeRepository extends BaseRepository {
  constructor() {
    super(Resume);
  }

  /**
   * Find resumes by user ID
   */
  async findByUserId(userId, options = {}) {
    try {
      const { status, template, isPublic, ...restOptions } = options;

      const filter = { userId };

      if (status) filter.status = status;
      if (template) filter['template.id'] = template;
      if (isPublic !== undefined) filter.isPublic = isPublic;

      return await this.paginate(filter, restOptions);
    } catch (error) {
      logger.error('Find by user ID error:', error);
      throw error;
    }
  }

  /**
   * Find resume by ID with ownership check
   */
  async findByIdAndOwner(resumeId, userId) {
    try {
      const resume = await this.findById(resumeId);
      if (!resume) {
        throw new NotFoundError('Resume not found');
      }

      if (resume.userId.toString() !== userId) {
        throw new ForbiddenError('You do not own this resume');
      }

      return resume;
    } catch (error) {
      logger.error('Find by ID and owner error:', error);
      throw error;
    }
  }

  /**
   * Find public resume by share token
   */
  async findByShareToken(shareToken) {
    try {
      return await this.model.findOne({
        shareToken,
        isPublic: true,
        status: { $ne: 'archived' },
      });
    } catch (error) {
      logger.error('Find by share token error:', error);
      throw error;
    }
  }

  /**
   * Create new resume
   */
  async createResume(userId, resumeData) {
    try {
      // Check if user has reached resume limit
      const user = await require('./user.repository').findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const usage = user.getUsageStats();
      if (usage.resumes.remaining === 0) {
        throw new ForbiddenError(
          'You have reached your resume limit. Please upgrade your plan.'
        );
      }

      const resume = await this.create({
        ...resumeData,
        userId,
      });

      // Increment user resume count
      await require('./user.repository').incrementUsage(userId, 'resumesCreated');

      return resume;
    } catch (error) {
      logger.error('Create resume error:', error);
      throw error;
    }
  }

  /**
   * Update resume
   */
  async updateResume(resumeId, userId, updateData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      // Remove fields that shouldn't be updated directly
      const safeUpdate = { ...updateData };
      delete safeUpdate.userId;
      delete safeUpdate._id;
      delete safeUpdate.createdAt;

      Object.assign(resume, safeUpdate);
      resume.lastModified = new Date();

      return await resume.save();
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
      const resume = await this.findByIdAndOwner(resumeId, userId);

      // Apply patch
      for (const [key, value] of Object.entries(patchData)) {
        resume[key] = value;
      }

      resume.lastAutoSave = new Date();
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Patch resume error:', error);
      throw error;
    }
  }

  /**
   * Duplicate resume
   */
  async duplicateResume(resumeId, userId) {
    try {
      const original = await this.findByIdAndOwner(resumeId, userId);

      // Create a copy
      const copyData = original.toJSON();
      delete copyData._id;
      delete copyData.createdAt;
      delete copyData.updatedAt;
      delete copyData.shareToken;

      copyData.title = `${copyData.title} (Copy)`;
      copyData.isFeatured = false;

      return await this.createResume(userId, copyData);
    } catch (error) {
      logger.error('Duplicate resume error:', error);
      throw error;
    }
  }

  /**
   * Delete resume
   */
  async deleteResume(resumeId, userId) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      await this.delete(resumeId);

      // Decrement user resume count if needed
      // await require('./user.repository').decrementUsage(userId, 'resumesCreated');

      return resume;
    } catch (error) {
      logger.error('Delete resume error:', error);
      throw error;
    }
  }

  /**
   * Change resume template
   */
  async changeTemplate(resumeId, userId, templateId, customizations = {}) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.template = {
        ...resume.template,
        id: templateId,
        customizations: {
          ...resume.template.customizations,
          ...customizations,
        },
      };

      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Change template error:', error);
      throw error;
    }
  }

  /**
   * Add work experience
   */
  async addExperience(resumeId, userId, experienceData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.workExperience.push(experienceData);
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Add experience error:', error);
      throw error;
    }
  }

  /**
   * Update work experience
   */
  async updateExperience(resumeId, userId, experienceId, updateData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      const experience = resume.workExperience.id(experienceId);
      if (!experience) {
        throw new NotFoundError('Experience not found');
      }

      Object.assign(experience, updateData);
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Update experience error:', error);
      throw error;
    }
  }

  /**
   * Delete work experience
   */
  async deleteExperience(resumeId, userId, experienceId) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.workExperience.id(experienceId).remove();
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Delete experience error:', error);
      throw error;
    }
  }

  /**
   * Add education
   */
  async addEducation(resumeId, userId, educationData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.education.push(educationData);
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Add education error:', error);
      throw error;
    }
  }

  /**
   * Update education
   */
  async updateEducation(resumeId, userId, educationId, updateData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      const education = resume.education.id(educationId);
      if (!education) {
        throw new NotFoundError('Education not found');
      }

      Object.assign(education, updateData);
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Update education error:', error);
      throw error;
    }
  }

  /**
   * Delete education
   */
  async deleteEducation(resumeId, userId, educationId) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.education.id(educationId).remove();
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Delete education error:', error);
      throw error;
    }
  }

  /**
   * Add skills
   */
  async addSkills(resumeId, userId, skillsData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      skillsData.forEach((skill) => {
        resume.skills.push(skill);
      });

      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Add skills error:', error);
      throw error;
    }
  }

  /**
   * Update skill
   */
  async updateSkill(resumeId, userId, skillId, updateData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      const skill = resume.skills.id(skillId);
      if (!skill) {
        throw new NotFoundError('Skill not found');
      }

      Object.assign(skill, updateData);
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Update skill error:', error);
      throw error;
    }
  }

  /**
   * Delete skill
   */
  async deleteSkill(resumeId, userId, skillId) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.skills.id(skillId).remove();
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Delete skill error:', error);
      throw error;
    }
  }

  /**
   * Add project
   */
  async addProject(resumeId, userId, projectData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.projects.push(projectData);
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Add project error:', error);
      throw error;
    }
  }

  /**
   * Update project
   */
  async updateProject(resumeId, userId, projectId, updateData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      const project = resume.projects.id(projectId);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      Object.assign(project, updateData);
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Update project error:', error);
      throw error;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(resumeId, userId, projectId) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.projects.id(projectId).remove();
      resume.lastModified = new Date();

      return await resume.save();
    } catch (error) {
      logger.error('Delete project error:', error);
      throw error;
    }
  }

  /**
   * Create share link
   */
  async createShareLink(resumeId, userId) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      await resume.generateShareToken();
      resume.isPublic = true;

      return await resume.save();
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
      const resume = await this.findByIdAndOwner(resumeId, userId);

      resume.isPublic = false;
      resume.shareToken = undefined;

      return await resume.save();
    } catch (error) {
      logger.error('Revoke share link error:', error);
      throw error;
    }
  }

  /**
   * Update ATS analysis
   */
  async updateATSAnalysis(resumeId, userId, analysisData) {
    try {
      const resume = await this.findByIdAndOwner(resumeId, userId);

      await resume.updateATSAnalysis(analysisData);

      return resume;
    } catch (error) {
      logger.error('Update ATS analysis error:', error);
      throw error;
    }
  }

  /**
   * Get resume statistics
   */
  async getResumeStats(userId) {
    try {
      return await this.model.getUserStats(userId);
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
      const searchQuery = {
        isPublic: true,
        status: 'complete',
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { summary: { $regex: query, $options: 'i' } },
        ],
      };

      return await this.paginate(searchQuery, options);
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
      return await this.findAll(
        {
          isFeatured: true,
          isPublic: true,
          status: 'complete',
        },
        { limit, sort: { createdAt: -1 } }
      );
    } catch (error) {
      logger.error('Get featured resumes error:', error);
      throw error;
    }
  }
}

module.exports = new ResumeRepository();
