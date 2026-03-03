// Import shared logger for consistent error output.
const logger = require('../config/logger');

// Import runtime env to control error response detail.
const env = require('../config/env');

// Centralized Express error middleware.
const errorHandler = (err, req, res, next) => {
  // Mark next as intentionally unused for Express middleware signature compatibility.
  void next;

  // Respect explicit status codes from upstream handlers when available.
  const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;

  // Log expected 4xx errors at info level and 5xx at error level.
  if (statusCode >= 500) {
    logger.error('Unhandled error:', err);
  } else {
    logger.info('Handled request error:', {
      statusCode,
      message: err?.message,
      method: req.method,
      path: req.originalUrl,
    });
  }

  // Use safe message defaults; expose internal details only outside production.
  const message =
    statusCode >= 500 ? 'Internal server error.' : err?.message || 'Request failed.';

  // Build consistent API error payload.
  const payload = {
    code: err?.code || 'INTERNAL_ERROR',
    error: message,
  };

  // Include stack only for non-production debugging.
  if (env.nodeEnv !== 'production' && err?.stack) {
    payload.stack = err.stack;
  }

  // Send normalized error payload to client.
  res.status(statusCode).json(payload);
};

// Fallback middleware for unmatched routes.
const notFoundHandler = (req, res) => {
  // Return route-level not found details.
  res.status(404).json({ error: 'Route not found.' });
};

// Export middleware functions.
module.exports = {
  errorHandler,
  notFoundHandler,
};
