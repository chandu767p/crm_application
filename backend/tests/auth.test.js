const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');

describe('Auth API', () => {
  it('should return 400 if login credentials are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    
    expect(res.status).to.equal(400);
    expect(res.body.success).to.be.false;
  });

  it('should return 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });
    
    expect(res.status).to.equal(401);
    expect(res.body.success).to.be.false;
  });
});
