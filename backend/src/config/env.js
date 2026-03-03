// Load environment variables from .env into process.env.
require('dotenv').config();

// Normalize and validate a network port from env/user input.
const normalizePort = (value, fallback) => {
  // Convert to number once to validate quickly.
  const parsed = Number(value);

  // Reject NaN, decimals, negative values, and very large ports.
  const isValidPort = Number.isInteger(parsed) && parsed > 0 && parsed <= 65535;

  // Use fallback if provided value is invalid.
  return isValidPort ? parsed : fallback;
};

// Normalize and validate a positive integer from env/user input.
const normalizePositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  const isValid = Number.isInteger(parsed) && parsed > 0;
  return isValid ? parsed : fallback;
};

// Build a centralized config object for runtime values.
const env = {
  // API server port with validation and a safe local default.
  port: normalizePort(process.env.PORT, 5000),

  // Shared API prefix so app and routes stay in sync.
  apiPrefix: process.env.API_PREFIX || '/api',

  // Human-readable service name used in logs and health responses.
  serviceName: process.env.SERVICE_NAME || 'internal-maps-backend',

  // Runtime mode for environment-specific behavior.
  nodeEnv: process.env.NODE_ENV || 'development',

  // Persistence mode: memory (default) or postgres.
  persistenceMode: process.env.PERSISTENCE_MODE || 'memory',

  // PostgreSQL connection settings used when persistence mode is postgres.
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: normalizePort(process.env.DB_PORT, 5432),
  dbName: process.env.DB_NAME || 'internal_maps',
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || '',
  dbSsl: String(process.env.DB_SSL || 'false').toLowerCase() === 'true',

  // Secret key used to sign and verify JWT access tokens.
  jwtSecret: process.env.JWT_SECRET || 'replace-this-jwt-secret-in-production',

  // Access token lifetime returned after successful login.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  // BCrypt rounds used when generating password hashes.
  authBcryptRounds: normalizePositiveInteger(process.env.AUTH_BCRYPT_ROUNDS, 10),

  // Global API rate limit window in milliseconds.
  apiRateLimitWindowMs: normalizePositiveInteger(
    process.env.API_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000
  ),

  // Global API max requests per window per client.
  apiRateLimitMax: normalizePositiveInteger(process.env.API_RATE_LIMIT_MAX, 1000),

  // Authentication endpoint rate limit window in milliseconds.
  authRateLimitWindowMs: normalizePositiveInteger(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000
  ),

  // Authentication endpoint max requests per window per client.
  authRateLimitMax: normalizePositiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 20),

  // Bootstrap admin credentials for initial API authentication flow.
  authAdminEmail: process.env.AUTH_ADMIN_EMAIL || 'admin@internal-maps.local',
  authAdminPassword: process.env.AUTH_ADMIN_PASSWORD || 'change-me-admin',

  // Bootstrap editor credentials with write access but no destructive admin actions.
  authEditorEmail: process.env.AUTH_EDITOR_EMAIL || 'editor@internal-maps.local',
  authEditorPassword: process.env.AUTH_EDITOR_PASSWORD || 'change-me-editor',

  // Bootstrap viewer credentials with read-only access.
  authViewerEmail: process.env.AUTH_VIEWER_EMAIL || 'viewer@internal-maps.local',
  authViewerPassword: process.env.AUTH_VIEWER_PASSWORD || 'change-me-viewer',
};

// Export validated environment configuration.
module.exports = env;
