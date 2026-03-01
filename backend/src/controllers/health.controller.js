// Import business/service logic for health checks.
const healthService = require('../services/health.service');

// HTTP controller for GET /api/health.
const getHealth = (req, res) => {
  // Ask the service layer for the health response data.
  const payload = healthService.getHealthSnapshot();

  // Return a successful health response.
  res.status(200).json(payload);
};

// Export controller handlers for route binding.
module.exports = {
  getHealth,
};
