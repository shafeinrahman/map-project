// Import token verification logic.
const authService = require('../services/auth.service');

// Build a consistent HTTP error object.
const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Protect routes by requiring a valid bearer token.
const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(createHttpError(401, 'Missing Authorization header.'));
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(createHttpError(401, 'Authorization must use Bearer token format.'));
  }

  try {
    const claims = authService.verifyAccessToken(token);

    req.auth = {
      userId: claims.sub,
      email: claims.email,
      role: claims.role,
      permissions: claims.permissions || [],
    };

    return next();
  } catch (error) {
    return next(createHttpError(401, 'Invalid or expired access token.'));
  }
};

// Authorize route access by one or more allowed roles.
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.auth) {
      return next(createHttpError(401, 'Authentication is required.'));
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return next(createHttpError(403, 'Insufficient role permissions.'));
    }

    return next();
  };
};

// Export authentication middleware.
module.exports = {
  requireAuth,
  authorizeRoles,
};
