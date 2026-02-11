/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.MONGODB_URI = 'mongodb://localhost:27017/resume_builder_test';
process.env.REDIS_URI = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-secret-key-min-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars';
process.env.ENCRYPTION_KEY = '1234567890abcdef1234567890abcdef';
process.env.CLIENT_URL = 'http://localhost:3000';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Generate test user data
  generateUserData: (overrides = {}) => ({
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    ...overrides
  }),

  // Generate test resume data
  generateResumeData: (overrides = {}) => ({
    title: 'Software Developer Resume',
    targetJobTitle: 'Software Developer',
    ...overrides
  }),

  // Generate auth headers
  generateAuthHeaders: (token) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, 2 + length);
  }
};

// Mock dependencies
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
}));

// Timeout for async operations
jest.setTimeout(10000);
