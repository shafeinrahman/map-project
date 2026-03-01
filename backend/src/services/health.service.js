// Import shared runtime configuration.
const env = require('../config/env');

// Build the health payload in one place for reuse and testing.
const getHealthSnapshot = () => {
  return {
    status: 'ok',
    service: env.serviceName,
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  };
};

// Export service methods for controllers.
module.exports = {
  getHealthSnapshot,
};
