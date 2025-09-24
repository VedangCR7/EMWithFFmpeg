import request from 'supertest';
import app from './app';

describe('Mobile API Endpoints', () => {
  describe('GET /api/mobile/business-categories', () => {
    it('should return business categories', async () => {
      const response = await request(app)
        .get('/api/mobile/business-categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
    });

    it('should return categories with required fields', async () => {
      const response = await request(app)
        .get('/api/mobile/business-categories')
        .expect(200);

      const categories = response.body.categories;
      categories.forEach((category: any) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('icon');
      });
    });
  });

  describe('GET /api/mobile/content/:customerId', () => {
    it('should return 400 for invalid customer ID', async () => {
      const response = await request(app)
        .get('/api/mobile/content/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/mobile/profile/:customerId', () => {
    it('should return 400 for invalid customer ID', async () => {
      const response = await request(app)
        .get('/api/mobile/profile/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
