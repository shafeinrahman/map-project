// Import shared logger.
const logger = require('../config/logger');

// Methods considered mutating operations for audit trails.
const mutatingMethods = new Set(['POST', 'PATCH', 'DELETE', 'PUT']);

// Build audit logging middleware for a named resource.
const auditMutation = (resource) => {
  return (req, res, next) => {
    if (!mutatingMethods.has(req.method)) {
      return next();
    }

    const startedAtMs = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAtMs;

      logger.info('AUDIT', {
        resource,
        action: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        actorUserId: req.auth?.userId || null,
        actorRole: req.auth?.role || 'anonymous',
        ip: req.ip,
        durationMs,
      });
    });

    return next();
  };
};

// Export audit middleware utilities.
module.exports = {
  auditMutation,
};
