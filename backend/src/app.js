// Import app-level dependencies.
const express = require('express');
const cors = require('cors');

// Import composed API routes.
const apiRoutes = require('./routes');

// Import runtime config shared across modules.
const env = require('./config/env');

// Import API-wide rate limiter middleware.
const { apiRateLimiter } = require('./middleware/rate-limit.middleware');

// Import centralized middleware.
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Create the Express app instance.
const app = express();

// Enable CORS so frontend clients can access this API.
app.use(cors());

// Parse incoming JSON bodies.
app.use(express.json());

// Parse URL-encoded request bodies.
app.use(express.urlencoded({ extended: true }));

// Minimal root endpoint for fast manual checks.
app.get('/', (req, res) => {
  // Return a small status message.
  res.status(200).json({ message: 'Internal Maps backend is running.' });
});

// Mount all API routes under /api.
app.use(env.apiPrefix, apiRateLimiter, apiRoutes);

// Handle unmatched routes after route registration.
app.use(notFoundHandler);

// Handle thrown errors after all route middleware.
app.use(errorHandler);

// Export app for server startup and future testing.
module.exports = app;
