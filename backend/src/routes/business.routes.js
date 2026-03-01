// Import Express router factory.
const express = require('express');

// Import business HTTP handlers.
const businessController = require('../controllers/business.controller');

// Import authentication and RBAC middleware.
const { requireAuth, authorizeRoles } = require('../middleware/auth.middleware');

// Create business-specific router.
const router = express.Router();

// Require login for all business endpoints.
router.use(requireAuth);

// Read operations are allowed for all known roles.
router.get('/', authorizeRoles('admin', 'editor', 'viewer'), businessController.listBusinesses);
router.get(
  '/geojson',
  authorizeRoles('admin', 'editor', 'viewer'),
  businessController.listBusinessesGeoJson
);
router.get(
  '/:businessId',
  authorizeRoles('admin', 'editor', 'viewer'),
  businessController.getBusinessById
);

// Write operations are allowed for editor and admin roles.
router.post('/', authorizeRoles('admin', 'editor'), businessController.createBusiness);
router.patch('/:businessId', authorizeRoles('admin', 'editor'), businessController.updateBusiness);

// Delete operation is reserved for admin role.
router.delete('/:businessId', authorizeRoles('admin'), businessController.deleteBusiness);

// Export business router.
module.exports = router;
