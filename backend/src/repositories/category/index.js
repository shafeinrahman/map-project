// Import environment configuration.
const env = require('../../config/env');

// Import category repository implementations.
const memoryRepository = require('./category.memory.repository');
const postgresRepository = require('./category.postgres.repository');

// Select repository implementation by persistence mode.
const repository = env.persistenceMode === 'postgres' ? postgresRepository : memoryRepository;

// Export selected category repository.
module.exports = repository;
