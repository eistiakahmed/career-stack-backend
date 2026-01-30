/**
 * Prisma Repositories Index
 * Centralized exports for all Prisma repositories
 */

const userRepository = require('./user.prisma.repository');
const resumeRepository = require('./resume.prisma.repository');

module.exports = {
  userRepository,
  resumeRepository,
};
