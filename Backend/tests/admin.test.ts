import request from 'supertest';
import app from './app';

describe('Admin API Endpoints', () => {
  describe('GET /api/admin/subadmins', () => {
    it('should return subadmins list', async () => {
      const response = await request(app)
        .get('/api/admin/subadmins')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('subadmins');
      expect(Array.isArray(response.body.subadmins)).toBe(true);
    });

    it('should return subadmins with required fields', async () => {
      const response = await request(app)
        .get('/api/admin/subadmins')
        .expect(200);

      const subadmins = response.body.subadmins;
      if (subadmins.length > 0) {
        const subadmin = subadmins[0];
        expect(subadmin).toHaveProperty('id');
        expect(subadmin).toHaveProperty('name');
        expect(subadmin).toHaveProperty('email');
        expect(subadmin).toHaveProperty('role');
        expect(subadmin).toHaveProperty('status');
        expect(subadmin).toHaveProperty('permissions');
        expect(subadmin).toHaveProperty('assignedCategories');
        expect(subadmin).toHaveProperty('createdAt');
        expect(subadmin).toHaveProperty('lastLogin');
      }
    });
  });

  describe('POST /api/admin/subadmins', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/admin/subadmins')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/admin/subadmins')
        .send({
          name: 'Test Subadmin',
          email: 'invalid-email',
          password: 'password123',
          role: 'Content Manager',
          permissions: ['Images'],
          assignedCategories: ['Restaurant']
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/admin/subadmins/:id', () => {
    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/admin/subadmins/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
