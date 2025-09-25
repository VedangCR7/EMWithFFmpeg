# Login APIs - Backend Implementation Guide

This document provides comprehensive specifications for implementing the authentication APIs required by the EventMarketers React Native app.

## 📁 File Location
- **Frontend API Service**: `src/services/loginAPIs.ts`
- **Main Index**: `src/services/index.ts`

## 🚀 Quick Start for Frontend Usage

```typescript
import { loginAPIs } from './src/services';

// Register a new user
const registerData = {
  email: 'user@example.com',
  password: 'SecurePassword123',
  companyName: 'My Company',
  phoneNumber: '+1234567890'
};
const response = await loginAPIs.registerUser(registerData);

// Login existing user
const loginData = {
  email: 'user@example.com',
  password: 'SecurePassword123'
};
const loginResponse = await loginAPIs.loginUser(loginData);
```

## 📋 Registration Form Field Mapping

Based on the actual `RegistrationScreen.tsx` form fields, here's how the frontend form data maps to the API:

| Form Field | API Field | Type | Required | Description |
|------------|-----------|------|----------|-------------|
| `name` | `companyName` | string | ✅ | Company/business name |
| `email` | `email` | string | ✅ | Email address |
| `password` | `password` | string | ✅ | User password |
| `phone` | `phone` | string | ✅ | Primary phone number |
| `auto-generated` | `deviceId` | string | ✅ | Unique device identifier |
| `description` | `description` | string | ❌ | Business description |
| `category` | `category` | string | ❌ | Business category |
| `address` | `address` | string | ❌ | Business address |
| `alternatePhone` | `alternatePhone` | string | ❌ | Alternate phone number |
| `website` | `website` | string | ❌ | Company website URL |
| `companyLogo` | `companyLogo` | string | ❌ | Company logo image URL |
| `name` | `displayName` | string | ❌ | Display name (same as company name) |

### Available Categories
The registration form includes these predefined categories:
- "Event Planners"
- "Decorators" 
- "Sound Suppliers"
- "Light Suppliers"

## 🔗 Required API Endpoints

### 1. User Registration
- **Endpoint**: `POST /api/mobile/auth/register`
- **Purpose**: Register new users from registration page
- **Request Body** (Based on actual RegistrationScreen.tsx form fields):
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "companyName": "My Company",
    "phoneNumber": "+1234567890",
    "deviceId": "device_1703123456789_abc123def",
    "description": "Professional event planning services",
    "category": "Event Planners",
    "address": "123 Main St, City, State",
    "alternatePhone": "+0987654321",
    "website": "https://mycompany.com",
    "companyLogo": "https://example.com/logo.png",
    "displayName": "My Company"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_123",
        "email": "user@example.com",
        "companyName": "My Company",
        "phoneNumber": "+1234567890",
        "description": "Professional event planning services",
        "category": "Event Planners",
        "address": "123 Main St, City, State",
        "alternatePhone": "+0987654321",
        "website": "https://mycompany.com",
        "companyLogo": "https://example.com/logo.png",
        "displayName": "My Company",
        "isEmailVerified": false,
        "isPhoneVerified": false,
        "subscriptionStatus": "free",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      },
      "token": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresIn": 3600
    },
    "message": "Registration successful"
  }
  ```

### 2. User Login
- **Endpoint**: `POST /api/mobile/auth/login`
- **Purpose**: Login existing users from login page
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "deviceId": "device_1703123456789_abc123def",
    "rememberMe": true
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_123",
        "email": "user@example.com",
        "companyName": "My Company",
        "lastLoginAt": "2024-01-01T12:00:00Z"
      },
      "token": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresIn": 3600
    },
    "message": "Login successful"
  }
  ```

### 3. Password Reset Request
- **Endpoint**: `POST /api/mobile/auth/forgot-password`
- **Purpose**: Send password reset email
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### 4. Password Reset Confirmation
- **Endpoint**: `POST /api/mobile/auth/reset-password`
- **Purpose**: Set new password using reset token
- **Request Body**:
  ```json
  {
    "token": "reset_token_here",
    "newPassword": "NewSecurePassword123",
    "confirmPassword": "NewSecurePassword123"
  }
  ```

### 5. Email Verification
- **Endpoint**: `POST /api/mobile/auth/verify-email`
- **Purpose**: Verify user's email address
- **Request Body**:
  ```json
  {
    "token": "verification_token_here"
  }
  ```

### 6. User Logout
- **Endpoint**: `POST /api/mobile/auth/logout`
- **Purpose**: Logout user and invalidate token
- **Headers**: `Authorization: Bearer jwt_token_here`

### 7. Token Refresh
- **Endpoint**: `POST /api/mobile/auth/refresh-token`
- **Purpose**: Refresh expired JWT tokens
- **Request Body**:
  ```json
  {
    "refreshToken": "refresh_token_here"
  }
  ```

## 🔒 Security Requirements

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Token Management
- **JWT Tokens**: 1 hour expiration
- **Refresh Tokens**: 30 days expiration
- **Reset Tokens**: 1 hour expiration
- **Verification Tokens**: 24 hours expiration

### Rate Limiting
- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **Password Reset**: 2 requests per hour per email

## ⚠️ Error Handling

### Common Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    "Specific validation error 1",
    "Specific validation error 2"
  ]
}
```

### Status Codes
- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict (email already exists)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

## 📊 Database Schema Suggestions

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  -- Additional fields from RegistrationScreen.tsx form
  description TEXT,
  category VARCHAR(100),
  address TEXT,
  alternate_phone VARCHAR(20),
  website VARCHAR(255),
  company_logo VARCHAR(255),
  display_name VARCHAR(255),
  -- System fields
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  subscription_status ENUM('free', 'premium', 'enterprise') DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

### Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Email Verification Tokens Table
```sql
CREATE TABLE email_verification_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🧪 Testing the APIs

### Registration Test
```bash
curl -X POST https://eventmarketersbackend.onrender.com/api/mobile/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "companyName": "Test Company",
    "phoneNumber": "+1234567890",
    "deviceId": "device_1703123456789_test123",
    "description": "Professional event planning services",
    "category": "Event Planners",
    "address": "123 Main St, City, State",
    "alternatePhone": "+0987654321",
    "website": "https://testcompany.com",
    "companyLogo": "https://example.com/logo.png",
    "displayName": "Test Company"
  }'
```

### Login Test
```bash
curl -X POST https://eventmarketersbackend.onrender.com/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "deviceId": "device_1703123456789_test123"
  }'
```

## 📞 Frontend Integration Examples

### Registration Page Usage
```typescript
import { loginAPIs } from '../services';

const handleRegister = async (formData) => {
  try {
    const response = await loginAPIs.registerUser({
      email: formData.email,
      password: formData.password,
      companyName: formData.name, // formData.name maps to companyName
      phoneNumber: formData.phone,
      description: formData.description,
      category: formData.category,
      address: formData.address,
      alternatePhone: formData.alternatePhone,
      website: formData.website,
      companyLogo: formData.companyLogo,
      displayName: formData.name
    });
    
    // Store token and redirect
    await AsyncStorage.setItem('authToken', response.data.token);
    navigation.navigate('Dashboard');
  } catch (error) {
    Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again');
  }
};
```

### Login Page Usage
```typescript
import { loginAPIs } from '../services';

const handleLogin = async (formData) => {
  try {
    const response = await loginAPIs.loginUser({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe
    });
    
    // Store token and redirect
    await AsyncStorage.setItem('authToken', response.data.token);
    navigation.navigate('Dashboard');
  } catch (error) {
    Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
  }
};
```

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Set up database schema
- [ ] Implement password hashing (bcrypt)
- [ ] Create JWT token generation/validation
- [ ] Set up email service for verification/reset
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Set up error handling
- [ ] Create API documentation
- [ ] Write unit tests
- [ ] Set up monitoring/logging

### Security Checklist
- [ ] Password strength validation
- [ ] Email format validation
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting implemented
- [ ] Secure token storage
- [ ] HTTPS enforcement
- [ ] Input sanitization
- [ ] Audit logging

## 🤝 Support

For questions about these APIs or implementation details, please contact the frontend development team or refer to the detailed comments in `src/services/loginAPIs.ts`.

---

**Note**: This API specification is designed to work seamlessly with the existing React Native EventMarketers app. All endpoints should follow RESTful conventions and return consistent response formats.
