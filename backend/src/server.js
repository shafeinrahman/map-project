// Import the configured Express app.
const app = require('./app');

// Import runtime environment configuration.
const env = require('./config/env');

// Import shared logger for startup messages.
const logger = require('./config/logger');

// Start listening for incoming HTTP requests.
app.listen(env.port, () => {
  // Log server URL for local development convenience.
  logger.info(`Backend server listening on http://localhost:${env.port}`);
});
