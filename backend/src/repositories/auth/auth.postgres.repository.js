// Import PostgreSQL query helper.
const db = require('../../db/postgres');

// Map DB row shape to auth user model.
const mapAuthUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    userId: Number(row.user_id),
    email: row.email,
    role: row.role,
    status: row.status,
    passwordHash: row.password_hash,
    password: null,
  };
};

// Return one user by normalized email.
const findUserByEmail = async (email) => {
  const result = await db.query(
    `
      SELECT
        user_id,
        email,
        role,
        status,
        password_hash
      FROM "user"
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [String(email || '').trim()]
  );

  return mapAuthUserRow(result.rows[0]);
};

// Export postgres auth repository methods.
module.exports = {
  findUserByEmail,
};
