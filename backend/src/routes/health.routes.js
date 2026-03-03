// Import Express to create a router object.
const express = require('express');

// Import controller methods for health endpoints.
const healthController = require('../controllers/health.controller');

// Create a dedicated router for health-related endpoints.
const router = express.Router();

// Health check endpoint used by monitoring and quick manual checks.
router.get('/', healthController.getHealth);

// Readiness check endpoint for orchestration probes.
router.get('/readiness', healthController.getReadiness);

// Export router so it can be mounted in route index.
module.exports = router;
