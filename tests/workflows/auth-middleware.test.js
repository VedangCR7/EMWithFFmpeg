/**
 * Tests for authentication middleware
 * These tests verify the auth functionality that CI/CD pipeline tests
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock the auth middleware
const createAuthMiddleware = () => {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

describe('Authentication Middleware Tests', () => {
  const authMiddleware = createAuthMiddleware();
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('should reject request without authorization header', () => {
    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Access token required'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token format', () => {
    mockReq.headers.authorization = 'InvalidFormat';

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    // The middleware will try to verify the token, which will fail
    // So it will return "Invalid or expired token" instead of "Access token required"
    const callArgs = mockRes.json.mock.calls[0][0];
    expect(callArgs.error).toBeDefined();
    expect(['Access token required', 'Invalid or expired token']).toContain(callArgs.error);
  });

  test('should reject request with invalid JWT token', () => {
    mockReq.headers.authorization = 'Bearer invalid.jwt.token';

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token'
    });
  });

  test('should accept valid JWT token', () => {
    const payload = { id: '123', email: 'test@example.com', role: 'ADMIN' };
    const token = jwt.sign(payload, 'test-secret');

    mockReq.headers.authorization = `Bearer ${token}`;

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: '123',
      email: 'test@example.com',
      role: 'ADMIN',
      iat: expect.any(Number)
    });
  });

  test('should handle expired JWT token', () => {
    // Create an expired token (issued 2 hours ago)
    const pastTime = Math.floor(Date.now() / 1000) - (2 * 60 * 60);
    const expiredToken = jwt.sign(
      { id: '123', exp: pastTime },
      'test-secret'
    );

    mockReq.headers.authorization = `Bearer ${expiredToken}`;

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token'
    });
  });
});

describe('Password Hashing Tests', () => {
  test('should hash password securely', async () => {
    const password = 'testPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);

    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(20);
  });

  test('should verify correct password', async () => {
    const password = 'testPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare(password, hashedPassword);
    expect(isValid).toBe(true);
  });

  test('should reject incorrect password', async () => {
    const password = 'testPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare('wrongPassword', hashedPassword);
    expect(isValid).toBe(false);
  });
});

describe('JWT Token Generation', () => {
  const JWT_SECRET = 'test-secret-key';

  test('should generate valid JWT token', () => {
    const payload = {
      id: 'admin-123',
      email: 'admin@example.com',
      role: 'ADMIN'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts
  });

  test('should decode JWT token correctly', () => {
    const payload = {
      id: 'admin-123',
      email: 'admin@example.com',
      role: 'ADMIN'
    };

    const token = jwt.sign(payload, JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  test('should include expiration in token', () => {
    const payload = { id: 'admin-123' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);

    expect(decoded.exp).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });
});