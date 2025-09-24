import { PrismaClient } from '@prisma/client';

// Global test setup
beforeAll(async () => {
  // Setup test database connection
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://eventmarketers_user:XMgWHtXJeE9G6tvUvvmbTIOumSD33w9G@dpg-d38ecjumcj7s7388sk60-a.oregon-postgres.render.com/eventmarketers_db';
  process.env.PORT = '0'; // Use random available port
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.BCRYPT_ROUNDS = '4';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
});

afterAll(async () => {
  // Cleanup after all tests
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});

// Global test timeout
jest.setTimeout(10000);
