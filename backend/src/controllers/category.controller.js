// Import category service logic.
const categoryService = require('../services/category.service');

// GET /api/categories
const listCategories = async (req, res) => {
  const result = await categoryService.listCategories(req.query);
  return res.status(200).json(result);
};

// Export category controller handlers.
module.exports = {
  listCategories,
};
