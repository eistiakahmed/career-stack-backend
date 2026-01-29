/**
 * Base Repository
 * Generic repository with common database operations
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find all documents
   */
  async findAll(filter = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      limit = 0,
      skip = 0,
      populate = [],
      select = null,
    } = options;

    let query = this.model.find(filter);

    if (select) query = query.select(select);
    if (populate.length > 0) populate.forEach((p) => query.populate(p));
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);

    return await query.sort(sort).exec();
  }

  /**
   * Find one document
   */
  async findOne(filter = {}, options = {}) {
    const { populate = [], select = null } = options;

    let query = this.model.findOne(filter);

    if (select) query = query.select(select);
    if (populate.length > 0) populate.forEach((p) => query.populate(p));

    return await query.exec();
  }

  /**
   * Find by ID
   */
  async findById(id, options = {}) {
    const { populate = [], select = null } = options;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    let query = this.model.findById(id);

    if (select) query = query.select(select);
    if (populate.length > 0) populate.forEach((p) => query.populate(p));

    return await query.exec();
  }

  /**
   * Create new document
   */
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      logger.error('Create error:', error);
      throw error;
    }
  }

  /**
   * Create many documents
   */
  async createMany(dataArray) {
    try {
      return await this.model.insertMany(dataArray);
    } catch (error) {
      logger.error('Create many error:', error);
      throw error;
    }
  }

  /**
   * Update document
   */
  async update(id, data, options = {}) {
    const { new: returnNew = true, runValidators = true } = options;

    try {
      return await this.model.findByIdAndUpdate(
        id,
        data,
        { new: returnNew, runValidators }
      ).exec();
    } catch (error) {
      logger.error('Update error:', error);
      throw error;
    }
  }

  /**
   * Update one document by filter
   */
  async updateOne(filter, data, options = {}) {
    const { new: returnNew = true } = options;

    try {
      return await this.model.findOneAndUpdate(
        filter,
        data,
        { new: returnNew }
      ).exec();
    } catch (error) {
      logger.error('Update one error:', error);
      throw error;
    }
  }

  /**
   * Update many documents
   */
  async updateMany(filter, data) {
    try {
      return await this.model.updateMany(filter, data).exec();
    } catch (error) {
      logger.error('Update many error:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async delete(id) {
    try {
      return await this.model.findByIdAndDelete(id).exec();
    } catch (error) {
      logger.error('Delete error:', error);
      throw error;
    }
  }

  /**
   * Delete one document by filter
   */
  async deleteOne(filter) {
    try {
      return await this.model.findOneAndDelete(filter).exec();
    } catch (error) {
      logger.error('Delete one error:', error);
      throw error;
    }
  }

  /**
   * Delete many documents
   */
  async deleteMany(filter) {
    try {
      return await this.model.deleteMany(filter).exec();
    } catch (error) {
      logger.error('Delete many error:', error);
      throw error;
    }
  }

  /**
   * Count documents
   */
  async count(filter = {}) {
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      logger.error('Count error:', error);
      throw error;
    }
  }

  /**
   * Exists check
   */
  async exists(filter = {}) {
    try {
      return await this.model.exists(filter).exec();
    } catch (error) {
      logger.error('Exists error:', error);
      throw error;
    }
  }

  /**
   * Paginate results
   */
  async paginate(filter = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      populate = [],
      select = null,
    } = options;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findAll(filter, { sort, limit, skip, populate, select }),
      this.count(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Aggregate
   */
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline).exec();
    } catch (error) {
      logger.error('Aggregate error:', error);
      throw error;
    }
  }

  /**
   * Bulk write operations
   */
  async bulkWrite(operations) {
    try {
      return await this.model.bulkWrite(operations);
    } catch (error) {
      logger.error('Bulk write error:', error);
      throw error;
    }
  }

  /**
   * Distinct values
   */
  async distinct(field, filter = {}) {
    try {
      return await this.model.distinct(field, filter).exec();
    } catch (error) {
      logger.error('Distinct error:', error);
      throw error;
    }
  }

  /**
   * Soft delete (if model supports it)
   */
  async softDelete(id) {
    try {
      return await this.update(id, { deletedAt: new Date(), isDeleted: true });
    } catch (error) {
      logger.error('Soft delete error:', error);
      throw error;
    }
  }
}

module.exports = BaseRepository;
