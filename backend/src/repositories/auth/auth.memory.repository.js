// Import runtime auth settings for bootstrap users.
const env = require('../../config/env');

// Bootstrap users for initial RBAC login flow.
const bootstrapUsers = [
  {
    userId: 1,
    email: String(env.authAdminEmail).trim().toLowerCase(),
    password: String(env.authAdminPassword),
    role: 'super-admin',
    status: 'active',
  },
  {
    userId: 2,
    email: String(env.authBusinessAdminEmail).trim().toLowerCase(),
    password: String(env.authBusinessAdminPassword),
    role: 'business-admin',
    status: 'active',
  },
  {
    userId: 3,
    email: String(env.authDeliveryEmail).trim().toLowerCase(),
    password: String(env.authDeliveryPassword),
    role: 'delivery',
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
