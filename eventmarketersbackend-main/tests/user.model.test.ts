
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Model', () => {
    const testUser = {
        email: 'testmodeluser@example.com',
        password: 'password123',
        name: 'Test Model User',
        companyName: 'Test Company',
        phone: '1234567890'
    };

    beforeAll(async () => {
        // Clean up if exists
        await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        await prisma.$disconnect();
    });

    it('should create a new user', async () => {
        const user = await prisma.user.create({
            data: {
                ...testUser,
                role: 'USER',
                isVerified: false
            }
        });

        expect(user).toBeDefined();
        expect(user.email).toBe(testUser.email);
        expect(user.companyName).toBe(testUser.companyName);
        expect(user.id).toBeDefined();
    });

    it('should find user by email', async () => {
        const user = await prisma.user.findUnique({
            where: { email: testUser.email }
        });

        expect(user).toBeDefined();
        expect(user?.name).toBe(testUser.name);
    });

    it('should update user fields', async () => {
        const user = await prisma.user.update({
            where: { email: testUser.email },
            data: { isVerified: true }
        });

        expect(user.isVerified).toBe(true);
    });
});
