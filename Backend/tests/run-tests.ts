#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import path from 'path';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

console.log('🧪 Starting EventMarketers Backend Tests...\n');

try {
  // Run database setup
  console.log('📊 Setting up test database...');
  execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
  
  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Run tests
  console.log('🚀 Running tests...');
  execSync('npm test', { stdio: 'inherit' });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error);
  process.exit(1);
}
