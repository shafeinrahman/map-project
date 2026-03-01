// Import JWT utility for stateless API authentication.
const jwt = require('jsonwebtoken');

// Import runtime auth settings.
const env = require('../config/env');

// Built-in role permission matrix for API authorization checks.
const rolePermissions = {
  admin: ['business:read', 'business:write', 'business:delete', 'poi:read', 'poi:write', 'poi:delete'],
  editor: ['business:read', 'business:write', 'poi:read', 'poi:write'],
  viewer: ['business:read', 'poi:read'],
};

// Bootstrap users for initial RBAC login flow.
const bootstrapUsers = [
  {
    userId: 1,
    email: String(env.authAdminEmail).trim().toLowerCase(),
    password: String(env.authAdminPassword),
    role: 'admin',
  },
  {
    userId: 2,
    email: String(env.authEditorEmail).trim().toLowerCase(),
    password: String(env.authEditorPassword),
    role: 'editor',
  },
  {
    userId: 3,
    email: String(env.authViewerEmail).trim().toLowerCase(),
    password: String(env.authViewerPassword),
    role: 'viewer',
  },
];

// Validate login credentials against bootstrap configuration.
const verifyCredentials = ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  const matched = bootstrapUsers.find(
    (user) => user.email === normalizedEmail && user.password === normalizedPassword
  );

  if (!matched) {
    return null;
  }

  return {
    userId: matched.userId,
    email: matched.email,
    role: matched.role,
    permissions: rolePermissions[matched.role] || [],
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
