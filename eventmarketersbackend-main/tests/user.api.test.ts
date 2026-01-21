
import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User API Endpoints', () => {
    const testUser = {
        email: 'testapiuser@example.com',
        password: 'password123',
        name: 'Test API User',
        companyName: 'API Company',
        phone: '1122334455'
    };

    let paramsUser: any;
    let token: string;

    beforeAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });

        // Create user and get token
        const response = await request(app)
            .post('/api/user/register')
            .send(testUser);

        token = response.body.data.token;
        paramsUser = response.body.data.user;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        await prisma.$disconnect();
    });

    it('should get user profile with valid token', async () => {
        const response = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(testUser.email);
        expect(response.body.data.user.id).toBe(paramsUser.id);
    });

    it('should update user profile', async () => {
        const newName = 'Updated API User';
        const response = await request(app)
            .put('/api/user/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: newName,
                companyName: testUser.companyName,
                phone: testUser.phone
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.name).toBe(newName);

        // Verify in DB
        const updatedUser = await prisma.user.findUnique({
            where: { email: testUser.email }
        });
        expect(updatedUser?.name).toBe(newName);
    });

    it('should return 401 without token', async () => {
        await request(app)
            .get('/api/user/profile')
            .expect(401);
    });
});
