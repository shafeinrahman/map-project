// Import PostgreSQL connection pool.
const { Pool } = require('pg');

// Import runtime environment settings.
const env = require('../config/env');

// Import logger for DB diagnostics.
const logger = require('../config/logger');

// Create a singleton PostgreSQL pool.
const pool = new Pool({
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
});

// Optional pool-level error visibility for easier troubleshooting.
pool.on('error', (error) => {
  logger.error('PostgreSQL pool error:', error);
});

// Execute one SQL query with optional parameters.
const query = (text, params = []) => {
  return pool.query(text, params);
};

// Check PostgreSQL connectivity using a lightweight query.
const checkHealth = async () => {
  const result = await query('SELECT 1 AS ok');
  return result.rows?.[0]?.ok === 1;
};

// Close pool connections during graceful shutdown.
const close = async () => {
  await pool.end();
};

// Export db helpers.
module.exports = {
  pool,
  query,
  checkHealth,
  close,
};
