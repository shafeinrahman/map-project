// Import authentication business logic.
const authService = require('../services/auth.service');

// Import env for auth response metadata.
const env = require('../config/env');

// Build a consistent HTTP error object.
const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// POST /api/auth/login
const login = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return next(createHttpError(400, 'email and password are required.'));
  }

  const user = authService.verifyCredentials({ email, password });

  if (!user) {
    return next(createHttpError(401, 'Invalid credentials.'));
  }

  const accessToken = authService.createAccessToken(user);

  return res.status(200).json({
    tokenType: 'Bearer',
    accessToken,
    expiresIn: env.jwtExpiresIn,
    user,
  });
};

// GET /api/auth/me
const me = (req, res) => {
  return res.status(200).json({ user: req.auth });
};

// Export auth controller handlers.
module.exports = {
  login,
  me,
};
