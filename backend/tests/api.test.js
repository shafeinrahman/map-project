const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.PERSISTENCE_MODE = 'memory';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

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
});
