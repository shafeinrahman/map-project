// Import the configured Express app.
const app = require('./app');

// Import runtime environment configuration.
const env = require('./config/env');

// Import shared logger for startup messages.
const logger = require('./config/logger');

// Import DB helpers for graceful shutdown.
const db = require('./db/postgres');

// Start listening for incoming HTTP requests.
const server = app.listen(env.port, () => {
  // Log server URL for local development convenience.
  logger.info(`Backend server listening on http://localhost:${env.port}`);
});

// Prevent duplicate shutdown execution.
let shutdownInProgress = false;

// Gracefully stop HTTP and DB connections.
const shutdown = async (signal) => {
  if (shutdownInProgress) {
    return;
  }

  shutdownInProgress = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    try {
      if (env.persistenceMode === 'postgres') {
        await db.close();
      }

      logger.info('Graceful shutdown completed.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
