/**
 * Resume Routes
 * Handles all resume CRUD operations, AI optimization, and export functionality
 */

const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { authenticate, optionalAuth, ownsResource } = require('../middlewares/auth.middleware');
const { hasPermission, checkUsageLimit } = require('../middlewares/rbac.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');
const { validate } = require('../middlewares/validation.middleware');

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for current user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate('resumeList'),
  resumeController.getResumes
);

/**
 * @route   GET /api/resumes/stats
 * @desc    Get resume statistics for dashboard
 * @access  Private
 */
router.get('/stats', authenticate, resumeController.getResumeStats);

/**
 * @route   POST /api/resumes
 * @desc    Create a new resume
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  checkUsageLimit('resume'),
  validate('resumeCreate'),
  resumeController.createResume
);

/**
 * @route   GET /api/resumes/:resumeId
 * @desc    Get a specific resume
 * @access  Private
 */
router.get(
  '/:resumeId',
  authenticate,
  validate('resumeGet'),
  resumeController.getResume
);

/**
 * @route   PUT /api/resumes/:resumeId
 * @desc    Update a resume
 * @access  Private
 */
router.put(
  '/:resumeId',
  authenticate,
  validate('resumeUpdate'),
  resumeController.updateResume
);

/**
 * @route   PATCH /api/resumes/:resumeId
 * @desc    Partially update a resume (autosave support)
 * @access  Private
 */
router.patch(
  '/:resumeId',
  authenticate,
  validate('resumePatch'),
  resumeController.patchResume
);

/**
 * @route   DELETE /api/resumes/:resumeId
 * @desc    Delete a resume
 * @access  Private
 */
router.delete(
  '/:resumeId',
  authenticate,
  validate('resumeDelete'),
  resumeController.deleteResume
);

/**
 * @route   POST /api/resumes/:resumeId/duplicate
 * @desc    Duplicate a resume
 * @access  Private
 */
router.post(
  '/:resumeId/duplicate',
  authenticate,
  checkUsageLimit('resume'),
  validate('resumeDuplicate'),
  resumeController.duplicateResume
);

/**
 * @route   PUT /api/resumes/:resumeId/template
 * @desc    Change resume template
 * @access  Private
 */
router.put(
  '/:resumeId/template',
  authenticate,
  validate('resumeTemplate'),
  resumeController.changeTemplate
);

// ============================================
// SECTIONS MANAGEMENT
// ============================================

/**
 * @route   POST /api/resumes/:resumeId/sections
 * @desc    Add a new section to resume
 * @access  Private
 */
router.post(
  '/:resumeId/sections',
  authenticate,
  validate('sectionCreate'),
  resumeController.addSection
);

/**
 * @route   PUT /api/resumes/:resumeId/sections/:sectionId
 * @desc    Update a section
 * @access  Private
 */
router.put(
  '/:resumeId/sections/:sectionId',
  authenticate,
  validate('sectionUpdate'),
  resumeController.updateSection
);

/**
 * @route   DELETE /api/resumes/:resumeId/sections/:sectionId
 * @desc    Delete a section
 * @access  Private
 */
router.delete(
  '/:resumeId/sections/:sectionId',
  authenticate,
  resumeController.deleteSection
);

/**
 * @route   PUT /api/resumes/:resumeId/sections/reorder
 * @desc    Reorder sections
 * @access  Private
 */
router.put(
  '/:resumeId/sections/reorder',
  authenticate,
  validate('sectionReorder'),
  resumeController.reorderSections
);

// ============================================
// WORK EXPERIENCE
// ============================================

/**
 * @route   POST /api/resumes/:resumeId/experience
 * @desc    Add work experience
 * @access  Private
 */
router.post(
  '/:resumeId/experience',
  authenticate,
  validate('experienceCreate'),
  resumeController.addExperience
);

/**
 * @route   PUT /api/resumes/:resumeId/experience/:experienceId
 * @desc    Update work experience
 * @access  Private
 */
router.put(
  '/:resumeId/experience/:experienceId',
  authenticate,
  validate('experienceUpdate'),
  resumeController.updateExperience
);

/**
 * @route   DELETE /api/resumes/:resumeId/experience/:experienceId
 * @desc    Delete work experience
 * @access  Private
 */
router.delete(
  '/:resumeId/experience/:experienceId',
  authenticate,
  resumeController.deleteExperience
);

// ============================================
// EDUCATION
// ============================================

/**
 * @route   POST /api/resumes/:resumeId/education
 * @desc    Add education
 * @access  Private
 */
router.post(
  '/:resumeId/education',
  authenticate,
  validate('educationCreate'),
  resumeController.addEducation
);

/**
 * @route   PUT /api/resumes/:resumeId/education/:educationId
 * @desc    Update education
 * @access  Private
 */
router.put(
  '/:resumeId/education/:educationId',
  authenticate,
  validate('educationUpdate'),
  resumeController.updateEducation
);

/**
 * @route   DELETE /api/resumes/:resumeId/education/:educationId
 * @desc    Delete education
 * @access  Private
 */
router.delete(
  '/:resumeId/education/:educationId',
  authenticate,
  resumeController.deleteEducation
);

// ============================================
// SKILLS
// ============================================

/**
 * @route   POST /api/resumes/:resumeId/skills
 * @desc    Add skills
 * @access  Private
 */
router.post(
  '/:resumeId/skills',
  authenticate,
  validate('skillsCreate'),
  resumeController.addSkills
);

/**
 * @route   PUT /api/resumes/:resumeId/skills/:skillId
 * @desc    Update a skill
 * @access  Private
 */
router.put(
  '/:resumeId/skills/:skillId',
  authenticate,
  validate('skillUpdate'),
  resumeController.updateSkill
);

/**
 * @route   DELETE /api/resumes/:resumeId/skills/:skillId
 * @desc    Delete a skill
 * @access  Private
 */
router.delete(
  '/:resumeId/skills/:skillId',
  authenticate,
  resumeController.deleteSkill
);

// ============================================
// PROJECTS
// ============================================

/**
 * @route   POST /api/resumes/:resumeId/projects
 * @desc    Add project
 * @access  Private
 */
router.post(
  '/:resumeId/projects',
  authenticate,
  validate('projectCreate'),
  resumeController.addProject
);

/**
 * @route   PUT /api/resumes/:resumeId/projects/:projectId
 * @desc    Update project
 * @access  Private
 */
router.put(
  '/:resumeId/projects/:projectId',
  authenticate,
  validate('projectUpdate'),
  resumeController.updateProject
);

/**
 * @route   DELETE /api/resumes/:resumeId/projects/:projectId
 * @desc    Delete project
 * @access  Private
 */
router.delete(
  '/:resumeId/projects/:projectId',
  authenticate,
  resumeController.deleteProject
);

// ============================================
// AI OPTIMIZATION
// ============================================

/**
 * @route   POST /api/resumes/:resumeId/optimize
 * @desc    AI-powered resume optimization
 * @access  Private (requires subscription)
 */
router.post(
  '/:resumeId/optimize',
  authenticate,
  hasPermission('AI_OPTIMIZE'),
  rateLimit.ai,
  validate('resumeOptimize'),
  resumeController.optimizeResume
);

/**
 * @route   POST /api/resumes/:resumeId/ats-score
 * @desc    Get ATS score and suggestions
 * @access  Private (requires subscription)
 */
router.post(
  '/:resumeId/ats-score',
  authenticate,
  hasPermission('AI_ANALYZE'),
  rateLimit.ai,
  validate('atsScore'),
  resumeController.getATSScore
);

/**
 * @route   POST /api/resumes/:resumeId/career-objective
 * @desc    Generate AI career objective
 * @access  Private (requires subscription)
 */
router.post(
  '/:resumeId/career-objective',
  authenticate,
  hasPermission('AI_GENERATE'),
  rateLimit.ai,
  validate('careerObjective'),
  resumeController.generateCareerObjective
);

/**
 * @route   POST /api/resumes/:resumeId/improve-section
 * @desc    AI section improvement
 * @access  Private (requires subscription)
 */
router.post(
  '/:resumeId/improve-section',
  authenticate,
  hasPermission('AI_OPTIMIZE'),
  rateLimit.ai,
  validate('improveSection'),
  resumeController.improveSection
);

// ============================================
// JOB DESCRIPTION MATCHING
// ============================================

/**
 * @route   POST /api/resumes/:resumeId/jd-match
 * @desc    Match resume against job description
 * @access  Private (requires subscription)
 */
router.post(
  '/:resumeId/jd-match',
  authenticate,
  hasPermission('AI_ANALYZE'),
  rateLimit.ai,
  validate('jdMatch'),
  resumeController.matchJobDescription
);

// ============================================
// EXPORT & SHARE
// ============================================

/**
 * @route   POST /api/resumes/:resumeId/export
 * @desc    Export resume to PDF
 * @access  Private
 */
router.post(
  '/:resumeId/export',
  authenticate,
  rateLimit.export,
  validate('resumeExport'),
  resumeController.exportResume
);

/**
 * @route   POST /api/resumes/:resumeId/export/docx
 * @desc    Export resume to DOCX
 * @access  Private
 */
router.post(
  '/:resumeId/export/docx',
  authenticate,
  rateLimit.export,
  validate('resumeExport'),
  resumeController.exportResumeDocx
);

/**
 * @route   GET /api/resumes/:resumeId/share
 * @desc    Get public share link
 * @access  Private
 */
router.get(
  '/:resumeId/share',
  authenticate,
  resumeController.getShareLink
);

/**
 * @route   POST /api/resumes/:resumeId/share
 * @desc    Create public share link
 * @access  Private
 */
router.post(
  '/:resumeId/share',
  authenticate,
  validate('createShareLink'),
  resumeController.createShareLink
);

/**
 * @route   DELETE /api/resumes/:resumeId/share
 * @desc    Revoke public share link
 * @access  Private
 */
router.delete(
  '/:resumeId/share',
  authenticate,
  resumeController.revokeShareLink
);

/**
 * @route   GET /api/resumes/shared/:shareId
 * @desc    View shared resume (public)
 * @access  Public
 */
router.get(
  '/shared/:shareId',
  optionalAuth,
  rateLimit.publicView,
  resumeController.viewSharedResume
);

// ============================================
// VERSION HISTORY
// ============================================

/**
 * @route   GET /api/resumes/:resumeId/versions
 * @desc    Get version history
 * @access  Private
 */
router.get(
  '/:resumeId/versions',
  authenticate,
  validate('versionList'),
  resumeController.getVersions
);

/**
 * @route   POST /api/resumes/:resumeId/versions/:versionId/restore
 * @desc    Restore previous version
 * @access  Private
 */
router.post(
  '/:resumeId/versions/:versionId/restore',
  authenticate,
  validate('versionRestore'),
  resumeController.restoreVersion
);

// ============================================
// AI CONTENT GENERATION
// ============================================

/**
 * @route   POST /api/resumes/ai/generate-summary
 * @desc    Generate professional summary
 * @access  Private (requires subscription)
 */
router.post(
  '/ai/generate-summary',
  authenticate,
  hasPermission('AI_GENERATE'),
  rateLimit.ai,
  validate('generateSummary'),
  resumeController.generateSummary
);

/**
 * @route   POST /api/resumes/ai/improve-achievement
 * @desc    Improve project/achievement description
 * @access  Private (requires subscription)
 */
router.post(
  '/ai/improve-achievement',
  authenticate,
  hasPermission('AI_OPTIMIZE'),
  rateLimit.ai,
  validate('improveAchievement'),
  resumeController.improveAchievement
);

/**
 * @route   POST /api/resumes/ai/suggest-skills
 * @desc    Get AI skill suggestions based on experience
 * @access  Private (requires subscription)
 */
router.post(
  '/ai/suggest-skills',
  authenticate,
  hasPermission('AI_ANALYZE'),
  rateLimit.ai,
  validate('suggestSkills'),
  resumeController.suggestSkills
);

module.exports = router;
