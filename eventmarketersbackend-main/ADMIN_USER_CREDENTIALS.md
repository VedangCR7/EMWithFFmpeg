# 🔐 **EventMarketers Admin User Credentials**

## 🎯 **Admin Users Created Successfully**

I've created admin and subadmin users for you with the following credentials:

---

## 👑 **ADMIN USER**

### **Login Credentials:**
- **Email:** `admin@eventmarketers.com`
- **Password:** `EventMarketers2024!`
- **Name:** EventMarketers Admin
- **Role:** ADMIN
- **Status:** Active

### **Admin Capabilities:**
- ✅ Full system access
- ✅ User management (create/edit subadmins)
- ✅ Content management (approve/reject content)
- ✅ Analytics access (all analytics endpoints)
- ✅ File management (upload, cleanup, statistics)
- ✅ Search functionality (all search endpoints)
- ✅ Subscription management (activate/deactivate customer subscriptions)
- ✅ System configuration

### **API Access:**
- All analytics endpoints (`/api/analytics/*`)
- All file management endpoints (`/api/file-management/*`)
- All search endpoints (`/api/search/*`)
- Admin management endpoints (`/api/admin/*`)
- Content management endpoints (`/api/content/*`)
- Subscription management endpoints (`/api/admin/customers/*/subscription`)

---

## 👥 **SUBADMIN USER**

### **Login Credentials:**
- **Email:** `subadmin@eventmarketers.com`
- **Password:** `SubAdmin2024!`
- **Name:** EventMarketers Subadmin
- **Role:** Content Manager
- **Status:** Active

### **Subadmin Capabilities:**
- ✅ Content management (upload, edit content)
- ✅ Analytics access (view analytics)
- ✅ File management (upload, view statistics)
- ✅ Search functionality (search content)
- ✅ Content approval (approve/reject content)

### **Permissions:**
- `manage_content` - Upload and manage content
- `view_analytics` - Access analytics dashboard
- `approve_content` - Approve or reject content

### **Assigned Categories:**
- Restaurant
- Wedding Planning
- Event Management

### **API Access:**
- Analytics endpoints (`/api/analytics/*`)
- File management endpoints (`/api/file-management/*`)
- Search endpoints (`/api/search/*`)
- Content management endpoints (`/api/content/*`)

---

## 🚀 **How to Use These Credentials**

### **1. API Testing (Postman/curl):**

#### **Admin Login:**
```bash
curl -X POST https://eventmarketersbackend.onrender.com/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eventmarketers.com",
    "password": "EventMarketers2024!"
  }'
```

#### **Subadmin Login:**
```bash
curl -X POST https://eventmarketersbackend.onrender.com/api/auth/subadmin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subadmin@eventmarketers.com",
    "password": "SubAdmin2024!"
  }'
```

### **2. Frontend Integration:**

#### **Admin Login Request:**
```javascript
const adminLogin = async () => {
  const response = await fetch('https://eventmarketersbackend.onrender.com/api/auth/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@eventmarketers.com',
      password: 'EventMarketers2024!'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('adminToken', data.token);
    console.log('Admin logged in successfully');
  }
};
```

#### **Subadmin Login Request:**
```javascript
const subadminLogin = async () => {
  const response = await fetch('https://eventmarketersbackend.onrender.com/api/auth/subadmin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'subadmin@eventmarketers.com',
      password: 'SubAdmin2024!'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('subadminToken', data.token);
    console.log('Subadmin logged in successfully');
  }
};
```

### **3. Using Tokens for API Calls:**

```javascript
const makeAuthenticatedRequest = async (endpoint, token) => {
  const response = await fetch(`https://eventmarketersbackend.onrender.com${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};

// Example: Get analytics dashboard
const analytics = await makeAuthenticatedRequest('/api/analytics/dashboard', adminToken);
```

---

## 🧪 **Test Results**

### **✅ Admin User Test:**
- **Login Status:** ✅ Successful
- **Token Generated:** ✅ Yes
- **Database Record:** ✅ Created
- **API Access:** ✅ Verified

### **✅ Subadmin User Test:**
- **Login Status:** ✅ Successful
- **Token Generated:** ✅ Yes
- **Database Record:** ✅ Created
- **API Access:** ✅ Verified

---

## 🔒 **Security Notes**

### **Password Security:**
- Passwords are hashed using bcrypt with 12 rounds
- Passwords are strong and include special characters
- Tokens expire after 7 days

### **Access Control:**
- Admin has full system access
- Subadmin has limited access based on permissions
- All API endpoints require proper authentication
- CORS is configured to allow your frontend

### **Token Usage:**
- Include token in Authorization header: `Bearer <token>`
- Tokens are JWT-based and contain user information
- Tokens expire after 7 days and need to be refreshed

---

## 📋 **Quick Reference**

### **Admin Credentials:**
```
Email: admin@eventmarketers.com
Password: EventMarketers2024!
```

### **Subadmin Credentials:**
```
Email: subadmin@eventmarketers.com
Password: SubAdmin2024!
```

### **API Base URL:**
```
https://eventmarketersbackend.onrender.com
```

### **Login Endpoints:**
```
POST /api/auth/admin/login
POST /api/auth/subadmin/login
```

---

## 🎯 **Next Steps**

1. **Test Login:** Use the credentials to test login functionality
2. **API Integration:** Use the tokens to access protected endpoints
3. **Frontend Integration:** Integrate these credentials into your frontend
4. **Content Management:** Start uploading and managing content
5. **Analytics:** Access the analytics dashboard

---

**Generated:** September 23, 2025  
**Status:** ✅ Users Created Successfully  
**Login Test:** ✅ Verified Working  
**API Access:** ✅ Ready to Use
