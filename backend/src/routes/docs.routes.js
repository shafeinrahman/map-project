const express = require('express');
const swaggerUi = require('swagger-ui-express');

const { buildOpenApiSpec } = require('../docs/openapi');

const router = express.Router();

router.get('/openapi.json', (req, res) => {
  void req;
  res.status(200).json(buildOpenApiSpec());
});

router.use('/docs', swaggerUi.serve, swaggerUi.setup(buildOpenApiSpec()));

module.exports = router;
