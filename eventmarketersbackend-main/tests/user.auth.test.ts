
import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Authentication Endpoints', () => {
    const testUser = {
        email: 'testauthuser@example.com',
        password: 'password123',
        name: 'Test Auth User',
        companyName: 'Auth Company',
        phone: '0987654321'
    };

    beforeAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        await prisma.$disconnect();
    });

    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/user/register')
            .send(testUser)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(testUser.email);
        expect(response.body.data.token).toBeDefined();
    });

    it('should not register user with existing email', async () => {
        const response = await request(app)
            .post('/api/user/register')
            .send(testUser)
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('User already exists');
    });

    it('should login with valid credentials', async () => {
        const response = await request(app)
            .post('/api/user/login')
            .send({
                email: testUser.email,
                password: testUser.password
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid password', async () => {
        const response = await request(app)
            .post('/api/user/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            })
            .expect(401);

        expect(response.body.success).toBe(false);
    });
});
