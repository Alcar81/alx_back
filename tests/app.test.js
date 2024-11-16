const request = require('supertest');
const app = require('../server');

describe('Test API routes', () => {
  it('GET /api/users should return 200', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
  });
});
