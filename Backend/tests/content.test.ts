import request from 'supertest';
import app from '../src/index';

describe('Content API Endpoints', () => {
  describe('GET /api/content/pending-approvals', () => {
    it('should return pending approvals', async () => {
      const response = await request(app)
        .get('/api/content/pending-approvals')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pendingApprovals');
      expect(Array.isArray(response.body.pendingApprovals)).toBe(true);
    });
  });

  describe('POST /api/content/images', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/content/images')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app)
        .post('/api/content/images')
        .send({
          title: 'Test Image',
          description: 'Test Description',
          category: 'INVALID_CATEGORY',
          businessCategoryId: 'test-id'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/content/videos', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/content/videos')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/content/:contentType/:id', () => {
    it('should return 400 for invalid content type', async () => {
      const response = await request(app)
        .delete('/api/content/invalid-type/test-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/content/images/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
