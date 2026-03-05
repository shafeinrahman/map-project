// Import Express router factory.
const express = require('express');

// Import category HTTP handlers.
const categoryController = require('../controllers/category.controller');

// Import auth middleware.
const { requireAuth, authorizeRoles } = require('../middleware/auth.middleware');

// Create category-specific router.
const router = express.Router();

// Require authentication for category operations.
router.use(requireAuth);

// List categories for filters and forms.
router.get('/', authorizeRoles('admin', 'editor', 'viewer'), categoryController.listCategories);

// Export category router.
module.exports = router;
