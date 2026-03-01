// Import Express to compose feature routes.
const express = require('express');

// Import route modules from feature folders.
const authRoutes = require('./auth.routes');
const businessRoutes = require('./business.routes');
const healthRoutes = require('./health.routes');
const poiRoutes = require('./poi.routes');

// Create a root API router.
const router = express.Router();

// Central registry for feature routes to keep mounts easy to extend.
const featureRoutes = [
	// Authentication endpoints for web UI access control.
	{ path: '/auth', handler: authRoutes },

	// Health and readiness endpoints.
	{ path: '/health', handler: healthRoutes },

	// Business CRUD endpoints with RBAC.
	{ path: '/businesses', handler: businessRoutes },

	// Point-of-interest CRUD and map-friendly data endpoints.
	{ path: '/pois', handler: poiRoutes },
];

// Mount all registered feature routes in one pass.
featureRoutes.forEach(({ path, handler }) => {
	// Each feature gets its own URL namespace.
	router.use(path, handler);
});

// Export composed API router.
module.exports = router;
