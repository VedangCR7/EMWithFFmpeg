import request from 'supertest';
import app from '../src/index';

describe('Installed Users API Endpoints', () => {
  describe('POST /api/installed-users/register', () => {
    it('should return 400 for missing device ID', async () => {
      const response = await request(app)
        .post('/api/installed-users/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/installed-users/register')
        .send({
          deviceId: 'test-device-id',
          email: 'invalid-email',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should successfully register a new user', async () => {
      const response = await request(app)
        .post('/api/installed-users/register')
        .send({
          deviceId: 'test-device-id-' + Date.now(),
          name: 'Test User',
          email: 'test@example.com'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('deviceId');
    });
  });

  describe('GET /api/installed-users/profile/:deviceId', () => {
    it('should return 400 for invalid device ID format', async () => {
      const response = await request(app)
        .get('/api/installed-users/profile/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/installed-users/profile/:deviceId', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .put('/api/installed-users/profile/test-device-id')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/installed-users/activity', () => {
    it('should return 400 for missing device ID', async () => {
      const response = await request(app)
        .post('/api/installed-users/activity')
        .send({
          action: 'view',
          resourceType: 'image',
          resourceId: 'test-id'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid action type', async () => {
      const response = await request(app)
        .post('/api/installed-users/activity')
        .send({
          deviceId: 'test-device-id',
          action: 'invalid-action',
          resourceType: 'image',
          resourceId: 'test-id'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
