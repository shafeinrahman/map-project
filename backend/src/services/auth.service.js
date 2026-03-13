// Import JWT utility for stateless API authentication.
const jwt = require('jsonwebtoken');

// Import bcrypt utility for password hash comparison.
const bcrypt = require('bcryptjs');

// Import runtime auth settings.
const env = require('../config/env');

// Import selected auth repository.
const authRepository = require('../repositories/auth');

// Built-in role permission matrix for API authorization checks.
const rolePermissions = {
  'super-admin': ['business:read', 'business:write', 'business:delete', 'poi:read', 'poi:write', 'poi:delete'],
  'business-admin': ['business:read', 'business:write', 'poi:read', 'poi:write'],
  delivery: ['business:read', 'poi:read'],
};

// Validate login credentials against bootstrap configuration.
const verifyCredentials = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  const matched = await authRepository.findUserByEmail(normalizedEmail);

  if (!matched) {
    return null;
  }

  if (String(matched.status || '').toLowerCase() !== 'active') {
    return null;
  }

  const isPostgresMode = env.persistenceMode === 'postgres';

  if (isPostgresMode && !matched.passwordHash) {
    return null;
  }

  const passwordIsValid = isPostgresMode
    ? await bcrypt.compare(normalizedPassword, String(matched.passwordHash || ''))
    : normalizedPassword === String(matched.password || '');

  if (!passwordIsValid) {
    return null;
  }

  const normalizedRole = String(matched.role || '').toLowerCase();
  const permissions = rolePermissions[normalizedRole] || [];

  return {
    userId: matched.userId,
    email: matched.email,
    role: normalizedRole,
    permissions,
  };
};

// Create a signed JWT used by clients as bearer access token.
const createAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.userId,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

// Verify an access token and return decoded claims.
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

// Export auth service operations.
module.exports = {
  rolePermissions,
  verifyCredentials,
  createAccessToken,
  verifyAccessToken,
};
