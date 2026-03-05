// Import selected category repository implementation.
const categoryRepository = require('../repositories/category');

// Return categories with optional filtering options.
const listCategories = async (filters = {}) => categoryRepository.listCategories(filters);

// Export category service operations.
module.exports = {
  listCategories,
};
