// Small logger utility to keep log formatting consistent across modules.
const logger = {
  // Info-level logs for normal operational messages.
  info: (...args) => {
    console.log('[INFO]', ...args);
  },

  // Error-level logs for failures and exceptions.
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
};

// Export shared logger functions.
module.exports = logger;
