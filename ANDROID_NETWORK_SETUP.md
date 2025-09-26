# Android Network Setup for Backend Connection

## Current Configuration
- **Backend URL**: `http://192.168.0.106:3001`
- **Frontend**: React Native Android app
- **Backend**: Node.js Express server

## Common Issues and Solutions

### 1. IP Address Mismatch
The IP address `192.168.0.106` might not be correct for your current network.

**To find your correct IP address:**
```bash
# On Windows
ipconfig

# On Mac/Linux
ifconfig
```

Look for your local network IP (usually starts with 192.168.x.x or 10.x.x.x)

### 2. Backend Server Not Accessible
Make sure the backend server is running and accessible:

```bash
cd eventmarketersbackend-main
npm run dev
```

The server should show:
```
🚀 Business Marketing Platform API
📡 Server running on port 3001
🌍 Environment: development
📊 Health check: http://localhost:3001/health
🔗 API base URL: http://localhost:3001/api
📱 Android access: http://192.168.0.106:3001/api
```

### 3. Firewall Issues
Make sure Windows Firewall allows Node.js through:
1. Open Windows Defender Firewall
2. Allow an app through firewall
3. Add Node.js if not already allowed

### 4. Network Configuration
Ensure both devices (computer and Android device) are on the same WiFi network.

### 5. Testing Connection
You can test if the backend is accessible by:
1. Opening browser on Android device
2. Go to: `http://192.168.0.106:3001/health`
3. Should see: `{"status":"healthy","timestamp":"...","version":"1.0.0","environment":"development","message":"EventMarketers Backend API is running"}`

## Fallback Behavior
If the backend is not accessible, the app will:
1. Show a timeout error in console
2. Automatically use mock data
3. Continue working with sample business profiles

This is normal behavior and the app will work fine with mock data.

## Update API Configuration
If you need to change the IP address, update `src/services/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://YOUR_IP_ADDRESS:3001', // Replace with your IP
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Troubleshooting Steps
1. Check if backend is running: `npm run dev` in eventmarketersbackend-main
2. Find your IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Test connection: Open `http://YOUR_IP:3001/health` in browser
4. Update API config if needed
5. Restart React Native app: `npx react-native start --reset-cache`
