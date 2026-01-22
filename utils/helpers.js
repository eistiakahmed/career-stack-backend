/**
 * Helper Functions
 * Common utility functions used across the application
 */

const crypto = require('crypto');
const { PATTERNS } = require('./constants');

/**
 * Generate a unique ID
 */
const generateId = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate a slug from text
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Validate email
 */
const isValidEmail = (email) => {
  return PATTERNS.EMAIL.test(email);
};

/**
 * Validate phone number
 */
const isValidPhone = (phone) => {
  return PATTERNS.PHONE.test(phone);
};

/**
 * Validate URL
 */
const isValidUrl = (url) => {
  return PATTERNS.URL.test(url);
};

/**
 * Format date to display string
 */
const formatDate = (date, format = 'MMM DD, YYYY') => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();

  switch (format) {
    case 'MMM DD, YYYY':
      return `${month} ${day}, ${year}`;
    case 'MMMM DD, YYYY':
      return `${month} ${day}, ${year}`;
    case 'MMM YYYY':
      return `${month} ${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    default:
      return d.toLocaleDateString();
  }
};

/**
 * Calculate duration between two dates
 */
const calculateDuration = (startDate, endDate = null) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  let duration = '';
  if (years > 0) {
    duration += `${years} yr${years > 1 ? 's' : ''}`;
  }
  if (remainingMonths > 0) {
    if (duration) duration += ' ';
    duration += `${remainingMonths} mo`;
  }

  return duration || '0 mo';
};

/**
 * Truncate text to specified length
 */
const truncate = (text, length = 100, suffix = '...') => {
  if (text.length <= length) return text;
  return text.substring(0, length - suffix.length) + suffix;
};

/**
 * Capitalize first letter of string
 */
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to title case
 */
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

/**
 * Remove duplicates from array
 */
const uniqueArray = (arr) => {
  return [...new Set(arr)];
};

/**
 * Shuffle array
 */
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Get nested object property safely
 */
const getNestedValue = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
};

/**
 * Set nested object property
 */
const setNestedValue = (obj, path, value) => {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
};

/**
 * Pick specific keys from object
 */
const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj && key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Omit specific keys from object
 */
const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

/**
 * Chunk array into smaller arrays
 */
const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Group array items by key
 */
const groupBy = (arr, key) => {
  return arr.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Sort array of objects by key
 */
const sortBy = (arr, key, order = 'asc') => {
  return arr.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Paginate array
 */
const paginateArray = (arr, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const paginatedItems = arr.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: arr.length,
      totalPages: Math.ceil(arr.length / limit),
    },
  };
};

/**
 * Generate random number within range
 */
const randomInt = (min = 0, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Round number to decimal places
 */
const roundTo = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * Format number with commas
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total, decimals = 2) => {
  if (total === 0) return 0;
  return roundTo((value / total) * 100, decimals);
};

/**
 * Delay execution
 */
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
const retry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      const backoffDelay = delayMs * Math.pow(2, attempt - 1);
      await delay(backoffDelay);
    }
  }
};

/**
 * Debounce function
 */
const debounce = (fn, delayMs) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delayMs);
  };
};

/**
 * Throttle function
 */
const throttle = (fn, delayMs) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delayMs) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
};

/**
 * Parse user agent string
 */
const parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();

  let browser = 'Unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';

  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { browser, os };
};

/**
 * Extract IP address from request
 */
const extractIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

module.exports = {
  generateId,
  generateSlug,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  formatDate,
  calculateDuration,
  truncate,
  capitalize,
  toTitleCase,
  uniqueArray,
  shuffleArray,
  deepClone,
  isEmpty,
  getNestedValue,
  setNestedValue,
  pick,
  omit,
  chunkArray,
  groupBy,
  sortBy,
  paginateArray,
  randomInt,
  roundTo,
  formatNumber,
  formatFileSize,
  calculatePercentage,
  delay,
  retry,
  debounce,
  throttle,
  parseUserAgent,
  extractIP,
};
