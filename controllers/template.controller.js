/**
 * Template Controller
 * Handles template-related HTTP requests
 */

const Template = require('../models/template.model');
const { successResponse } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const { NotFoundError } = require('../utils/error');
const logger = require('../utils/logger');

class TemplateController {
  /**
   * Get all templates
   */
  getTemplates = asyncHandler(async (req, res) => {
    const {
      category,
      tier,
      industry,
      experienceLevel,
      isPremium,
      isFeatured,
      search,
      page,
      limit,
      sort,
    } = req.query;

    let query = Template.find({ isActive: true });

    // Apply filters
    if (category) query = query.where('category', category);
    if (industry) query = query.where('industry', industry);
    if (experienceLevel) query = query.where('experienceLevel', experienceLevel);
    if (isPremium !== undefined) query = query.where('isPremium', isPremium);
    if (isFeatured) query = query.where('isFeatured', true);
    if (tier) {
      query = query.where('requiredTier').in(['free', tier]);
    }

    // Search
    if (search) {
      query = query.where({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ],
      });
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOption = { sort_order: 1, createdAt: -1 };
    if (sort === 'popular') sortOption = { usageCount: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const [templates, total] = await Promise.all([
      query.sort(sortOption).skip(skip).limit(limitNum),
      query.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        templates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get featured templates
   */
  getFeaturedTemplates = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const templates = await Template.findFeaturedTemplates(parseInt(limit));

    return successResponse(
      res,
      { templates },
      'Featured templates retrieved successfully'
    );
  });

  /**
   * Get template categories
   */
  getCategories = asyncHandler(async (req, res) => {
    const categories = [
      { value: 'minimal', label: 'Minimal', description: 'Clean and simple designs' },
      {
        value: 'corporate',
        label: 'Corporate',
        description: 'Professional business templates',
      },
      {
        value: 'executive',
        label: 'Executive',
        description: 'For senior professionals',
      },
      {
        value: 'developer',
        label: 'Developer',
        description: 'Tech and programming focused',
      },
      {
        value: 'creative',
        label: 'Creative',
        description: 'Artistic and unique designs',
      },
      {
        value: 'ats',
        label: 'ATS-Friendly',
        description: 'Optimized for applicant tracking systems',
      },
      {
        value: 'modern',
        label: 'Modern',
        description: 'Contemporary and stylish',
      },
      {
        value: 'startup',
        label: 'Startup',
        description: 'Perfect for startup roles',
      },
    ];

    return successResponse(
      res,
      { categories },
      'Categories retrieved successfully'
    );
  });

  /**
   * Get template by ID
   */
  getTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;

    const template = await Template.findOne({ _id: templateId, isActive: true });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return successResponse(res, { template }, 'Template retrieved successfully');
  });

  /**
   * Get template preview
   */
  getTemplatePreview = asyncHandler(async (req, res) => {
    const { templateId } = req.params;

    const template = await Template.findOne({ _id: templateId, isActive: true });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return successResponse(
      res,
      {
        preview: template.preview,
        thumbnail: template.thumbnail,
        screenshots: template.screenshots,
      },
      'Template preview retrieved successfully'
    );
  });
}

module.exports = new TemplateController();
