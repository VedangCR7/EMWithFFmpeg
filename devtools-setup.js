#!/usr/bin/env node

// React Native DevTools Setup Script
// This script properly initializes React DevTools for React Native debugging

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 React Native DevTools Setup');
console.log('================================');

// Check if react-devtools is installed
try {
  const devtoolsPath = require.resolve('react-devtools');
  console.log('✅ react-devtools found at:', devtoolsPath);
} catch (error) {
  console.log('❌ react-devtools not found, installing...');
  try {
    execSync('npm install --save-dev react-devtools', { stdio: 'inherit' });
    console.log('✅ react-devtools installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install react-devtools:', installError.message);
    process.exit(1);
  }
}

// Start devtools on a specific port
const port = process.env.DEVTOOLS_PORT || 8099;
console.log(`🚀 Starting React DevTools on port ${port}...`);

try {
  // Start devtools as a subprocess
  const { spawn } = require('child_process');
  const devtools = spawn('cmd', ['/c', 'npx', 'react-devtools', '--port', port], {
    stdio: 'inherit',
    shell: true,
    detached: false
  });
  
  console.log(`✅ React DevTools running on http://localhost:${port}`);
  console.log('💡 Open this URL in Chrome/Edge to access DevTools');
  
  // Wait a moment for server to start
  setTimeout(() => {
    console.log('🔍 Checking if DevTools is accessible...');
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 3000
    };
    
    const req = http.request(options, (res) => {
      console.log(`✅ DevTools server responded with status: ${res.statusCode}`);
      console.log('🌐 DevTools is ready for connection!');
    });
    
    req.on('error', (err) => {
      console.log('❌ DevTools server not accessible:', err.message);
      console.log('💡 Try running: npx react-devtools --port 8099');
    });
    
    req.on('timeout', () => {
      console.log('⏰ DevTools server timeout');
      req.destroy();
    });
    
    req.end();
  }, 2000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    devtools.kill('SIGINT');
    process.exit(0);
  });
  
  devtools.on('close', (code) => {
    console.log(`DevTools process exited with code ${code}`);
  });
  
} catch (error) {
  console.error('❌ Failed to start React DevTools:', error.message);
  process.exit(1);
}
