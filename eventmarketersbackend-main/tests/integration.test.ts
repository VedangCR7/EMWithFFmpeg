import request from 'supertest';
import app from '../src/index';

describe('Integration Tests', () => {
  describe('API Flow Tests', () => {
    it('should handle complete user registration and profile flow', async () => {
      const deviceId = 'integration-test-' + Date.now();
      
      // 1. Register a new user
      const registerResponse = await request(app)
        .post('/api/installed-users/register')
        .send({
          deviceId,
          name: 'Integration Test User',
          email: 'integration@example.com'
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const userId = registerResponse.body.user.id;

      // 2. Get business categories
      const categoriesResponse = await request(app)
        .get('/api/mobile/business-categories')
        .expect(200);

      expect(categoriesResponse.body.categories.length).toBeGreaterThan(0);

      // 3. Record user activity
      const activityResponse = await request(app)
        .post('/api/installed-users/activity')
        .send({
          deviceId,
          action: 'view',
          resourceType: 'category',
          resourceId: categoriesResponse.body.categories[0].id
        })
        .expect(201);

      expect(activityResponse.body.success).toBe(true);
    });

    it('should handle admin subadmin management flow', async () => {
      // 1. Get existing subadmins
      const subadminsResponse = await request(app)
        .get('/api/admin/subadmins')
        .expect(200);

      expect(subadminsResponse.body.success).toBe(true);
      expect(Array.isArray(subadminsResponse.body.subadmins)).toBe(true);

      // 2. Get pending content approvals
      const approvalsResponse = await request(app)
        .get('/api/content/pending-approvals')
        .expect(200);

      expect(approvalsResponse.body.success).toBe(true);
      expect(Array.isArray(approvalsResponse.body.pendingApprovals)).toBe(true);
    });
  });

  describe('Error Handling Tests', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/api/non-existent-route');
      expect(response.body).toHaveProperty('method', 'GET');
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle requests with missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send('email=test@example.com&password=test123')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('token');
      expect(response.body).not.toHaveProperty('secret');
    });

    it('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/installed-users/profile/1; DROP TABLE users; --')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle XSS attempts', async () => {
      const response = await request(app)
        .post('/api/installed-users/register')
        .send({
          deviceId: '<script>alert("xss")</script>',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
