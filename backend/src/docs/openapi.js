// Build static OpenAPI description for current backend endpoints.
const buildOpenApiSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'Internal Maps Backend API',
    version: '1.0.0',
    description: 'RBAC-secured backend API for authentication, businesses, and POIs.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate user and return JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Authenticated successfully' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Return authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Authenticated user profile' } },
      },
    },
    '/businesses': {
      get: {
        summary: 'List businesses',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Business list' } },
      },
      post: {
        summary: 'Create business',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Business created' } },
      },
    },
    '/businesses/{businessId}': {
      get: {
        summary: 'Get business by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Business details' } },
      },
      patch: {
        summary: 'Update business by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Business updated' } },
      },
      delete: {
        summary: 'Delete business by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Business deleted' } },
      },
    },
    '/pois': {
      get: {
        summary: 'List POIs',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'POI list' } },
      },
      post: {
        summary: 'Create POI',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'POI created' } },
      },
    },
    '/pois/{poiId}': {
      get: {
        summary: 'Get POI by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'poiId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'POI details' } },
      },
      patch: {
        summary: 'Update POI by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'poiId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'POI updated' } },
      },
      delete: {
        summary: 'Delete POI by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'poiId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'POI deleted' } },
      },
    },
  },
});

module.exports = {
  buildOpenApiSpec,
};
