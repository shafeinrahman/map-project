// Import shared runtime configuration.
const env = require('../config/env');

// Import DB helper for readiness checks.
const db = require('../db/postgres');

// Build the health payload in one place for reuse and testing.
const getHealthSnapshot = () => {
  return {
    status: 'ok',
    service: env.serviceName,
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  };
};

// Build readiness payload including dependency checks.
const getReadinessSnapshot = async () => {
  const dependencies = {
    database: {
      required: env.persistenceMode === 'postgres',
      status: 'skipped',
    },
  };

  if (env.persistenceMode === 'postgres') {
    try {
      const isHealthy = await db.checkHealth();
      dependencies.database.status = isHealthy ? 'ok' : 'error';
    } catch (error) {
      dependencies.database.status = 'error';
      dependencies.database.error = error.message;
    }
  }

  const hasErrors = Object.values(dependencies).some((item) => item.status === 'error');

  return {
    status: hasErrors ? 'degraded' : 'ready',
    service: env.serviceName,
    environment: env.nodeEnv,
    persistenceMode: env.persistenceMode,
    dependencies,
    timestamp: new Date().toISOString(),
  };
};

// Export service methods for controllers.
module.exports = {
  getHealthSnapshot,
  getReadinessSnapshot,
};
