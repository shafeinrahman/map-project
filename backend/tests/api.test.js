const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.PERSISTENCE_MODE = 'memory';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

const loginAs = async (email, password) => {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.accessToken, 'string');
  return response.body.accessToken;
};

test('GET /api/health returns healthy payload', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(typeof response.body.timestamp, 'string');
});

test('GET /api/health/readiness returns readiness payload', async () => {
  const response = await request(app).get('/api/health/readiness');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ready');
  assert.equal(response.body.persistenceMode, 'memory');
});

test('POST /api/auth/login rejects invalid credentials', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'admin@internal-maps.local',
    password: 'wrong-password',
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'Invalid credentials.');
});

test('POST /api/auth/login and GET /api/auth/me succeed with valid credentials', async () => {
  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'admin@internal-maps.local',
    password: 'change-me-admin',
  });

  assert.equal(loginResponse.status, 200);
  assert.equal(typeof loginResponse.body.accessToken, 'string');

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

  assert.equal(meResponse.status, 200);
  assert.equal(meResponse.body.user.role, 'admin');
});

test('viewer role cannot create business', async () => {
  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'viewer@internal-maps.local',
    password: 'change-me-viewer',
  });

  const createResponse = await request(app)
    .post('/api/businesses')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
    .send({
      name: 'Viewer Test Business',
      latitude: 0.3,
      longitude: 32.6,
    });

  assert.equal(createResponse.status, 403);
  assert.equal(createResponse.body.error, 'Insufficient role permissions.');
});

test('GET /api/openapi.json returns OpenAPI document', async () => {
  const response = await request(app).get('/api/openapi.json');

  assert.equal(response.status, 200);
  assert.equal(response.body.openapi, '3.0.3');
  assert.ok(response.body.paths['/auth/login']);
  assert.ok(response.body.paths['/health']);
  assert.ok(response.body.paths['/health/readiness']);
  assert.ok(response.body.paths['/businesses/geojson']);
  assert.ok(response.body.paths['/pois/geojson']);

  const businessGetParameters = response.body.paths['/businesses']?.get?.parameters || [];
  const businessGeoJsonParameters = response.body.paths['/businesses/geojson']?.get?.parameters || [];
  const poiGetParameters = response.body.paths['/pois']?.get?.parameters || [];
  const poiGeoJsonParameters = response.body.paths['/pois/geojson']?.get?.parameters || [];

  assert.ok(businessGetParameters.some((param) => param.name === 'limit'));
  assert.ok(businessGeoJsonParameters.some((param) => param.name === 'offset'));
  assert.ok(poiGetParameters.some((param) => param.name === 'poiType'));
  assert.ok(poiGeoJsonParameters.some((param) => param.name === 'limit'));
});

test('GET /api/openapi.json includes critical component schemas', async () => {
  const response = await request(app).get('/api/openapi.json');

  assert.equal(response.status, 200);

  const schemas = response.body.components?.schemas || {};

  assert.ok(schemas.Pagination);
  assert.ok(schemas.Business);
  assert.ok(schemas.Poi);
  assert.ok(schemas.ErrorResponse);
  assert.ok(schemas.GeoJsonFeatureCollection);

  const businessesListSchema = schemas.BusinessesListResponse;
  const poisListSchema = schemas.PoisListResponse;

  assert.equal(
    businessesListSchema?.properties?.pagination?.$ref,
    '#/components/schemas/Pagination'
  );
  assert.equal(
    poisListSchema?.properties?.pagination?.$ref,
    '#/components/schemas/Pagination'
  );
});

test('GET /api/openapi.json marks protected operations with bearer auth', async () => {
  const response = await request(app).get('/api/openapi.json');

  assert.equal(response.status, 200);

  const paths = response.body.paths || {};

  const protectedOperations = [
    paths['/auth/me']?.get,
    paths['/businesses']?.get,
    paths['/businesses']?.post,
    paths['/businesses/geojson']?.get,
    paths['/businesses/{businessId}']?.get,
    paths['/businesses/{businessId}']?.patch,
    paths['/businesses/{businessId}']?.delete,
    paths['/pois']?.get,
    paths['/pois']?.post,
    paths['/pois/geojson']?.get,
    paths['/pois/{poiId}']?.get,
    paths['/pois/{poiId}']?.patch,
    paths['/pois/{poiId}']?.delete,
  ];

  for (const operation of protectedOperations) {
    assert.ok(operation);
    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
  }

  assert.equal(paths['/auth/login']?.post?.security, undefined);
  assert.equal(paths['/health']?.get?.security, undefined);
  assert.equal(paths['/health/readiness']?.get?.security, undefined);
});

test('GET /api/businesses returns paginated list shape', async () => {
  const token = await loginAs('admin@internal-maps.local', 'change-me-admin');

  const createResponse = await request(app)
    .post('/api/businesses')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Pagination Contract Business',
      status: 'active',
      latitude: 0.31,
      longitude: 32.61,
    });

  assert.equal(createResponse.status, 201);

  const listResponse = await request(app)
    .get('/api/businesses?limit=5&offset=0&status=active')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listResponse.status, 200);
  assert.ok(Array.isArray(listResponse.body.items));
  assert.equal(typeof listResponse.body.pagination, 'object');
  assert.equal(typeof listResponse.body.pagination.total, 'number');
  assert.equal(listResponse.body.pagination.limit, 5);
  assert.equal(listResponse.body.pagination.offset, 0);
});

test('GET /api/pois/geojson returns feature collection shape', async () => {
  const token = await loginAs('admin@internal-maps.local', 'change-me-admin');

  const createResponse = await request(app)
    .post('/api/pois')
    .set('Authorization', `Bearer ${token}`)
    .send({
      poiName: 'GeoJSON Contract POI',
      poiType: 'general',
      latitude: 0.32,
      longitude: 32.62,
    });

  assert.equal(createResponse.status, 201);

  const geoResponse = await request(app)
    .get('/api/pois/geojson?limit=10&offset=0')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(geoResponse.status, 200);
  assert.equal(geoResponse.body.type, 'FeatureCollection');
  assert.ok(Array.isArray(geoResponse.body.features));
  assert.equal(typeof geoResponse.body.pagination, 'object');
  assert.equal(typeof geoResponse.body.pagination.total, 'number');
  assert.equal(geoResponse.body.pagination.limit, 10);
  assert.equal(geoResponse.body.pagination.offset, 0);

  const firstFeature = geoResponse.body.features[0];
  if (firstFeature) {
    assert.equal(firstFeature.type, 'Feature');
    assert.equal(firstFeature.geometry?.type, 'Point');
    assert.ok(Array.isArray(firstFeature.geometry?.coordinates));
  }
});
