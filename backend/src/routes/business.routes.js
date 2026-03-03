// Import Express router factory.
const express = require('express');

// Import business HTTP handlers.
const businessController = require('../controllers/business.controller');

// Import authentication and RBAC middleware.
const { requireAuth, authorizeRoles } = require('../middleware/auth.middleware');

// Import audit middleware for business mutations.
const { auditMutation } = require('../middleware/audit.middleware');

// Import schema-based validation middleware.
const { validateBody, validateParams, validateQuery } = require('../middleware/schema.middleware');

// Import route validation schemas.
const {
  businessIdParamsSchema,
  businessListQuerySchema,
  businessCreateBodySchema,
  businessUpdateBodySchema,
} = require('../schemas/business.schemas');

// Create business-specific router.
const router = express.Router();

// Require login for all business endpoints.
router.use(requireAuth);

// Audit mutation activity for business endpoints.
router.use(auditMutation('business'));

// Read operations are allowed for all known roles.
router.get(
  '/',
  authorizeRoles('admin', 'editor', 'viewer'),
  validateQuery(businessListQuerySchema),
  businessController.listBusinesses
);
router.get(
  '/geojson',
  authorizeRoles('admin', 'editor', 'viewer'),
  validateQuery(businessListQuerySchema),
  businessController.listBusinessesGeoJson
);
router.get(
  '/:businessId',
  validateParams(businessIdParamsSchema),
  authorizeRoles('admin', 'editor', 'viewer'),
  businessController.getBusinessById
);

// Write operations are allowed for editor and admin roles.
router.post(
  '/',
  authorizeRoles('admin', 'editor'),
  validateBody(businessCreateBodySchema),
  businessController.createBusiness
);
router.patch(
  '/:businessId',
  validateParams(businessIdParamsSchema),
  authorizeRoles('admin', 'editor'),
  validateBody(businessUpdateBodySchema),
  businessController.updateBusiness
);

// Delete operation is reserved for admin role.
router.delete(
  '/:businessId',
  validateParams(businessIdParamsSchema),
  authorizeRoles('admin'),
  businessController.deleteBusiness
);

// Export business router.
module.exports = router;
