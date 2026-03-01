// Import Express to create route namespace.
const express = require('express');

// Import auth HTTP handlers.
const authController = require('../controllers/auth.controller');

// Import auth guard for protected auth endpoints.
const { requireAuth } = require('../middleware/auth.middleware');

// Create dedicated auth router.
const router = express.Router();

// Login route for web UI to obtain JWT access token.
router.post('/login', authController.login);

// Current user route to validate token and fetch auth context.
router.get('/me', requireAuth, authController.me);

// Export auth router for root API composition.
module.exports = router;
