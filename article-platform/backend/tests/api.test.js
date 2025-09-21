const request = require('supertest');
const express = require('express');

describe('API Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    app.get('/health', (req, res) => {
      res.json({ status: 'healthy' });
    });
  });

  test('GET /health should return healthy status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  test('Invalid route should return 404', async () => {
    const response = await request(app).get('/invalid');
    expect(response.status).toBe(404);
  });
});