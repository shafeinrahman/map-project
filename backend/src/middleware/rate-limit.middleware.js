// Import rate limiter middleware factory.
const rateLimit = require('express-rate-limit');

// Import runtime configuration values.
const env = require('../config/env');

// Shared limiter response body for throttled requests.
const buildRateLimitMessage = (message) => ({
  error: message,
});

// Global API limiter for broad protection.
const apiRateLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  max: env.apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildRateLimitMessage('Too many API requests. Please retry later.'),
});

// Stricter limiter for authentication attempts.
const authRateLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildRateLimitMessage('Too many login attempts. Please retry later.'),
});

// Export rate limiter middleware instances.
module.exports = {
  apiRateLimiter,
  authRateLimiter,
};
