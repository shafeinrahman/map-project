// Import Express router factory.
const express = require('express');

// Import POI HTTP handlers.
const poiController = require('../controllers/poi.controller');

// Import auth middleware for protected DB-facing endpoints.
const { requireAuth, authorizeRoles } = require('../middleware/auth.middleware');

// Import audit middleware for POI mutations.
const { auditMutation } = require('../middleware/audit.middleware');

// Import schema-based validation middleware.
const { validateBody, validateParams, validateQuery } = require('../middleware/schema.middleware');

// Import route validation schemas.
const {
	poiIdParamsSchema,
	poiListQuerySchema,
	poiCreateBodySchema,
	poiUpdateBodySchema,
} = require('../schemas/poi.schemas');

// Create POI-specific router namespace.
const router = express.Router();

// Require authentication for all POI operations.
router.use(requireAuth);

// Audit mutation activity for POI endpoints.
router.use(auditMutation('poi'));

// List POIs with optional filters and pagination.
router.get(
	'/',
	authorizeRoles('admin', 'editor', 'viewer'),
	validateQuery(poiListQuerySchema),
	poiController.listPois
);

// Return POIs in GeoJSON format for map layers.
router.get(
	'/geojson',
	authorizeRoles('admin', 'editor', 'viewer'),
	validateQuery(poiListQuerySchema),
	poiController.listPoisGeoJson
);

// Fetch one POI by id.
router.get(
	'/:poiId',
	validateParams(poiIdParamsSchema),
	authorizeRoles('admin', 'editor', 'viewer'),
	poiController.getPoiById
);

// Create one POI.
router.post(
	'/',
	authorizeRoles('admin', 'editor'),
	validateBody(poiCreateBodySchema),
	poiController.createPoi
);

// Partially update one POI.
router.patch(
	'/:poiId',
	validateParams(poiIdParamsSchema),
	authorizeRoles('admin', 'editor'),
	validateBody(poiUpdateBodySchema),
	poiController.updatePoi
);

// Delete one POI.
router.delete(
	'/:poiId',
	validateParams(poiIdParamsSchema),
	authorizeRoles('admin'),
	poiController.deletePoi
);

// Export router for root API composition.
module.exports = router;
