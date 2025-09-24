# EventMarketers Backend Tests

This directory contains comprehensive tests for the EventMarketers backend API.

## Test Structure

### Test Files
- `health.test.ts` - Health endpoint tests
- `auth.test.ts` - Authentication endpoint tests
- `mobile.test.ts` - Mobile API endpoint tests
- `admin.test.ts` - Admin API endpoint tests
- `content.test.ts` - Content management endpoint tests
- `businessProfile.test.ts` - Business profile endpoint tests
- `installedUsers.test.ts` - Installed users endpoint tests
- `integration.test.ts` - Integration and security tests

### Configuration Files
- `setup.ts` - Test environment setup
- `test.env` - Test environment variables
- `run-tests.ts` - Test runner script

## Running Tests

### Basic Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Advanced Test Commands
```bash
# Setup test database and run tests
npm run test:setup

# Full test suite with coverage
npm run test:full
```

### Individual Test Files
```bash
# Run specific test file
npm test -- health.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Authentication"
```

## Test Coverage

The tests cover:
- ✅ Health endpoint functionality
- ✅ Authentication flows (admin, subadmin)
- ✅ Mobile API endpoints
- ✅ Admin management endpoints
- ✅ Content management endpoints
- ✅ Business profile endpoints
- ✅ User registration and management
- ✅ Error handling and validation
- ✅ Security tests (XSS, SQL injection)
- ✅ Integration flows

## Test Environment

Tests run in a separate environment with:
- Test database (SQLite file)
- Reduced security settings for faster execution
- Mocked external services
- Isolated test data

## Writing New Tests

### Test Structure
```typescript
import request from 'supertest';
import app from '../src/index';

describe('Feature Name', () => {
  describe('Endpoint Name', () => {
    it('should handle valid request', async () => {
      const response = await request(app)
        .get('/api/endpoint')
        .expect(200);

      expect(response.body).toHaveProperty('expectedField');
    });

    it('should handle invalid request', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
```

### Best Practices
1. **Test both success and failure cases**
2. **Use descriptive test names**
3. **Test input validation**
4. **Test authentication and authorization**
5. **Test error responses**
6. **Use proper assertions**
7. **Clean up test data**

## Continuous Integration

Tests are configured to run in CI/CD pipelines with:
- Automatic test database setup
- Coverage reporting
- Parallel test execution
- Failure reporting

## Debugging Tests

### Common Issues
1. **Database connection errors** - Check test.env configuration
2. **Port conflicts** - Ensure test port (3002) is available
3. **Timeout errors** - Increase jest timeout in setup.ts
4. **Import errors** - Check file paths and exports

### Debug Commands
```bash
# Run single test with verbose output
npm test -- --verbose health.test.ts

# Run tests with debug output
DEBUG=* npm test

# Run tests and keep test database
NODE_ENV=test npm test
```

## Test Data

Tests use isolated test data that doesn't affect production:
- Test database is reset before each test run
- Mock data is used for external services
- Test users and content are created and cleaned up automatically
