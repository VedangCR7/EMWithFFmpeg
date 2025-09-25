import request from 'supertest';
import app from '../src/index';

describe('Business Profile API Endpoints', () => {
  describe('GET /api/business-profile/profile', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/business-profile/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/business-profile/profile', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/business-profile/profile')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/business-profile/profile')
        .send({
          businessName: 'Test Business',
          businessEmail: 'invalid-email',
          businessPhone: '+1234567890',
          businessCategory: 'Restaurant'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid phone format', async () => {
      const response = await request(app)
        .post('/api/business-profile/profile')
        .send({
          businessName: 'Test Business',
          businessEmail: 'test@example.com',
          businessPhone: 'invalid-phone',
          businessCategory: 'Restaurant'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/business-profile/upload-logo', () => {
    it('should return 400 without file', async () => {
      const response = await request(app)
        .post('/api/business-profile/upload-logo')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/business-profile/logo', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/business-profile/logo')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
