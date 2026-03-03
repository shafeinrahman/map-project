// Import runtime auth settings for bootstrap users.
const env = require('../../config/env');

// Bootstrap users for initial RBAC login flow.
const bootstrapUsers = [
  {
    userId: 1,
    email: String(env.authAdminEmail).trim().toLowerCase(),
    password: String(env.authAdminPassword),
    role: 'admin',
    status: 'active',
  },
  {
    userId: 2,
    email: String(env.authEditorEmail).trim().toLowerCase(),
    password: String(env.authEditorPassword),
    role: 'editor',
    status: 'active',
  },
  {
    userId: 3,
    email: String(env.authViewerEmail).trim().toLowerCase(),
    password: String(env.authViewerPassword),
    role: 'viewer',
    status: 'active',
  },
];

// Return one user by normalized email from in-memory bootstrap records.
const findUserByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const matched = bootstrapUsers.find((user) => user.email === normalizedEmail);

  if (!matched) {
    return null;
  }

  return {
    userId: matched.userId,
    email: matched.email,
    role: matched.role,
    status: matched.status,
    password: matched.password,
    passwordHash: null,
  };
};

// Export memory auth repository methods.
module.exports = {
  findUserByEmail,
};
