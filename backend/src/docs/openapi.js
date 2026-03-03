const businessListParameters = [
  { name: 'status', in: 'query', schema: { type: 'string' } },
  { name: 'categoryId', in: 'query', schema: { type: 'integer', minimum: 1 } },
  { name: 'routeId', in: 'query', schema: { type: 'integer', minimum: 1 } },
  { name: 'territoryId', in: 'query', schema: { type: 'integer', minimum: 1 } },
  { name: 'minLat', in: 'query', schema: { type: 'number', minimum: -90, maximum: 90 } },
  { name: 'maxLat', in: 'query', schema: { type: 'number', minimum: -90, maximum: 90 } },
  { name: 'minLng', in: 'query', schema: { type: 'number', minimum: -180, maximum: 180 } },
  { name: 'maxLng', in: 'query', schema: { type: 'number', minimum: -180, maximum: 180 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500 } },
  { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0 } },
];

const poiListParameters = [
  { name: 'poiType', in: 'query', schema: { type: 'string' } },
  { name: 'createdBy', in: 'query', schema: { type: 'integer', minimum: 1 } },
  { name: 'minLat', in: 'query', schema: { type: 'number', minimum: -90, maximum: 90 } },
  { name: 'maxLat', in: 'query', schema: { type: 'number', minimum: -90, maximum: 90 } },
  { name: 'minLng', in: 'query', schema: { type: 'number', minimum: -180, maximum: 180 } },
  { name: 'maxLng', in: 'query', schema: { type: 'number', minimum: -180, maximum: 180 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500 } },
  { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0 } },
];

const successNoContent = {
  description: 'No content.',
};

// Build static OpenAPI description for current backend endpoints.
const buildOpenApiSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'Internal Maps Backend API',
    version: '1.0.0',
    description: 'RBAC-secured backend API for authentication, health, businesses, and POIs.',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth' },
    { name: 'Health' },
    { name: 'Businesses' },
    { name: 'POIs' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
        required: ['error'],
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
        required: ['total', 'limit', 'offset'],
      },
      User: {
        type: 'object',
        properties: {
          userId: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          role: {
            type: 'string',
            enum: ['admin', 'editor', 'viewer'],
          },
        },
        required: ['userId', 'email', 'role'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
        required: ['accessToken', 'user'],
      },
      AuthMeResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
        },
        required: ['user'],
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
          service: { type: 'string' },
          env: { type: 'string' },
        },
      },
      ReadinessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ready' },
          timestamp: { type: 'string', format: 'date-time' },
          service: { type: 'string' },
          persistenceMode: { type: 'string' },
        },
      },
      Business: {
        type: 'object',
        properties: {
          businessId: { type: 'integer' },
          name: { type: 'string' },
          addressText: { type: 'string' },
          categoryId: { type: ['integer', 'null'] },
          routeId: { type: ['integer', 'null'] },
          territoryId: { type: ['integer', 'null'] },
          status: { type: 'string' },
          priority: { type: ['integer', 'null'] },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: ['integer', 'null'] },
          updatedAt: { type: 'string', format: 'date-time' },
          updatedBy: { type: ['integer', 'null'] },
        },
      },
      Poi: {
        type: 'object',
        properties: {
          poiId: { type: 'integer' },
          poiType: { type: 'string' },
          poiName: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          createdBy: { type: ['integer', 'null'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      BusinessesListResponse: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/Business' },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      PoisListResponse: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/Poi' },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      GeoJsonFeatureCollection: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['FeatureCollection'] },
          features: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Feature'] },
                geometry: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['Point'] },
                    coordinates: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 2,
                      maxItems: 2,
                    },
                  },
                },
                properties: { type: 'object', additionalProperties: true },
              },
            },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      BusinessCreateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          addressText: { type: 'string' },
          categoryId: { type: 'integer', minimum: 1 },
          routeId: { type: 'integer', minimum: 1 },
          territoryId: { type: 'integer', minimum: 1 },
          status: { type: 'string' },
          priority: { type: 'integer' },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
        },
        required: ['name', 'latitude', 'longitude'],
      },
      BusinessUpdateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          addressText: { type: 'string' },
          categoryId: { type: 'integer', minimum: 1 },
          routeId: { type: 'integer', minimum: 1 },
          territoryId: { type: 'integer', minimum: 1 },
          status: { type: 'string' },
          priority: { type: 'integer' },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
        },
      },
      PoiCreateRequest: {
        type: 'object',
        properties: {
          poiType: { type: 'string' },
          poiName: { type: 'string' },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
        },
        required: ['poiType', 'poiName', 'latitude', 'longitude'],
      },
      PoiUpdateRequest: {
        type: 'object',
        properties: {
          poiType: { type: 'string' },
          poiName: { type: 'string' },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Basic service health check',
        responses: {
          '200': {
            description: 'Service health payload.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/health/readiness': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe for runtime dependencies',
        responses: {
          '200': {
            description: 'Service readiness payload.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadinessResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate user and return JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Return authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user profile.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthMeResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/businesses': {
      get: {
        tags: ['Businesses'],
        summary: 'List businesses',
        security: [{ bearerAuth: [] }],
        parameters: businessListParameters,
        responses: {
          '200': {
            description: 'Business list.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BusinessesListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Businesses'],
        summary: 'Create business',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BusinessCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Business created.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Business' },
              },
            },
          },
          '400': {
            description: 'Invalid payload.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'Insufficient role permissions.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/businesses/geojson': {
      get: {
        tags: ['Businesses'],
        summary: 'List businesses as GeoJSON',
        security: [{ bearerAuth: [] }],
        parameters: businessListParameters,
        responses: {
          '200': {
            description: 'Business GeoJSON feature collection.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GeoJsonFeatureCollection' },
              },
            },
          },
        },
      },
    },
    '/businesses/{businessId}': {
      get: {
        tags: ['Businesses'],
        summary: 'Get business by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Business details.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Business' },
              },
            },
          },
          '404': {
            description: 'Business not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Businesses'],
        summary: 'Update business by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BusinessUpdateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Business updated.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Business' },
              },
            },
          },
          '404': {
            description: 'Business not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Businesses'],
        summary: 'Delete business by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '204': successNoContent,
          '404': {
            description: 'Business not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/pois': {
      get: {
        tags: ['POIs'],
        summary: 'List POIs',
        security: [{ bearerAuth: [] }],
        parameters: poiListParameters,
        responses: {
          '200': {
            description: 'POI list.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PoisListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['POIs'],
        summary: 'Create POI',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PoiCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'POI created.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Poi' },
              },
            },
          },
          '400': {
            description: 'Invalid payload.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'Insufficient role permissions.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/pois/geojson': {
      get: {
        tags: ['POIs'],
        summary: 'List POIs as GeoJSON',
        security: [{ bearerAuth: [] }],
        parameters: poiListParameters,
        responses: {
          '200': {
            description: 'POI GeoJSON feature collection.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GeoJsonFeatureCollection' },
              },
            },
          },
        },
      },
    },
    '/pois/{poiId}': {
      get: {
        tags: ['POIs'],
        summary: 'Get POI by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'poiId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'POI details.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Poi' },
              },
            },
          },
          '404': {
            description: 'POI not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['POIs'],
        summary: 'Update POI by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'poiId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PoiUpdateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'POI updated.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Poi' },
              },
            },
          },
          '404': {
            description: 'POI not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['POIs'],
        summary: 'Delete POI by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'poiId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '204': successNoContent,
          '404': {
            description: 'POI not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
});

module.exports = {
  buildOpenApiSpec,
};
