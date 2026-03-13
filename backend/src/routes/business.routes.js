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
  authorizeRoles('super-admin', 'business-admin', 'delivery'),
  validateQuery(businessListQuerySchema),
  businessController.listBusinesses
);
router.get(
  '/geojson',
  authorizeRoles('super-admin', 'business-admin', 'delivery'),
  validateQuery(businessListQuerySchema),
  businessController.listBusinessesGeoJson
);
router.get(
  '/:businessId',
  validateParams(businessIdParamsSchema),
  authorizeRoles('super-admin', 'business-admin', 'delivery'),
  businessController.getBusinessById
);

// Write operations are allowed for business-admin and super-admin roles.
router.post(
  '/',
  authorizeRoles('super-admin', 'business-admin'),
  validateBody(businessCreateBodySchema),
  businessController.createBusiness
);
router.patch(
  '/:businessId',
  validateParams(businessIdParamsSchema),
  authorizeRoles('super-admin', 'business-admin'),
  validateBody(businessUpdateBodySchema),
  businessController.updateBusiness
);

// Delete operation is reserved for super-admin role.
router.delete(
  '/:businessId',
  validateParams(businessIdParamsSchema),
  authorizeRoles('super-admin'),
  businessController.deleteBusiness
);

// Export business router.
module.exports = router;
