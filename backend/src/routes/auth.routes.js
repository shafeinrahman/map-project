// Import Express to create route namespace.
const express = require('express');

// Import auth HTTP handlers.
const authController = require('../controllers/auth.controller');

// Import auth guard for protected auth endpoints.
const { requireAuth } = require('../middleware/auth.middleware');

// Import route-level rate limiting.
const { authRateLimiter } = require('../middleware/rate-limit.middleware');

// Import audit middleware for auth mutations.
const { auditMutation } = require('../middleware/audit.middleware');

// Import request validators.
const { validateBody } = require('../middleware/schema.middleware');

// Import request schemas.
const { loginBodySchema } = require('../schemas/auth.schemas');

// Create dedicated auth router.
const router = express.Router();

// Audit mutation activity for auth endpoints.
router.use(auditMutation('auth'));

// Login route for web UI to obtain JWT access token.
router.post('/login', authRateLimiter, validateBody(loginBodySchema), authController.login);

// Current user route to validate token and fetch auth context.
router.get('/me', requireAuth, authController.me);

// Export auth router for root API composition.
module.exports = router;
