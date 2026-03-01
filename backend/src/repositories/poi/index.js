// Import environment configuration.
const env = require('../../config/env');

// Import repository implementations.
const memoryRepository = require('./poi.memory.repository');
const postgresRepository = require('./poi.postgres.repository');

// Select repository implementation by persistence mode.
const repository = env.persistenceMode === 'postgres' ? postgresRepository : memoryRepository;

// Export selected repository.
module.exports = repository;
