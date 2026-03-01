// Import Express router factory.
const express = require('express');

// Import POI HTTP handlers.
const poiController = require('../controllers/poi.controller');

// Import auth middleware for protected DB-facing endpoints.
const { requireAuth, authorizeRoles } = require('../middleware/auth.middleware');

// Create POI-specific router namespace.
const router = express.Router();

// Require authentication for all POI operations.
router.use(requireAuth);

// List POIs with optional filters and pagination.
router.get('/', authorizeRoles('admin', 'editor', 'viewer'), poiController.listPois);

// Return POIs in GeoJSON format for map layers.
router.get('/geojson', authorizeRoles('admin', 'editor', 'viewer'), poiController.listPoisGeoJson);

// Fetch one POI by id.
router.get('/:poiId', authorizeRoles('admin', 'editor', 'viewer'), poiController.getPoiById);

// Create one POI.
router.post('/', authorizeRoles('admin', 'editor'), poiController.createPoi);

// Partially update one POI.
router.patch('/:poiId', authorizeRoles('admin', 'editor'), poiController.updatePoi);

// Delete one POI.
router.delete('/:poiId', authorizeRoles('admin'), poiController.deletePoi);

// Export router for root API composition.
module.exports = router;
