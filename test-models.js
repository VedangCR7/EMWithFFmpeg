// Simple test runner for model validation
const fs = require('fs');
const path = require('path');

// Import our models
const UserModel = require('./src/models/User.ts');
const VideoModel = require('./src/models/Video.ts');
const GreetingModel = require('./src/models/Greeting.ts');

console.log('Running Model Tests...\n');

// Test User Model
console.log('Testing User Model:');
try {
  const user = new UserModel.UserModel('1', 'John Doe', 'john@example.com');
  console.log('✓ User creation:', user.isValid());
  console.log('✓ User display name:', user.getDisplayName());
  console.log('✓ User admin check:', user.isAdmin());

  user.updatePreferences({ theme: 'dark' });
  console.log('✓ User preferences update:', user.preferences.theme === 'dark');

  user.deactivate();
  console.log('✓ User deactivation:', !user.isActive);
} catch (error) {
  console.log('✗ User model test failed:', error.message);
}

// Test Video Model
console.log('\nTesting Video Model:');
try {
  const video = new VideoModel.VideoModel('1', 'user1', 'Test Video', 'Description', 'url');
  console.log('✓ Video creation:', video.isValid());
  console.log('✓ Video processing status:', video.status === 'processing');

  video.updateProgress(100);
  console.log('✓ Video progress update:', video.isProcessed());

  video.incrementViews();
  video.like();
  console.log('✓ Video engagement:', video.views === 1 && video.likes === 1);
} catch (error) {
  console.log('✗ Video model test failed:', error.message);
}

// Test Greeting Model
console.log('\nTesting Greeting Model:');
try {
  const greeting = new GreetingModel.GreetingModel('1', 'user1', 't1', 'Test Greeting', 'Content');
  console.log('✓ Greeting creation:', greeting.isValid());
  console.log('✓ Greeting status:', greeting.status === 'draft');

  greeting.publish();
  console.log('✓ Greeting publication:', greeting.status === 'published' && greeting.isPublic);

  greeting.addComment('Nice!');
  console.log('✓ Greeting comments:', greeting.comments.length === 1);

  greeting.incrementViews();
  greeting.incrementDownloads();
  greeting.updateRating(4.5);
  console.log('✓ Greeting stats:', greeting.views === 1 && greeting.downloads === 1 && greeting.rating === 4.5);
} catch (error) {
  console.log('✗ Greeting model test failed:', error.message);
}

console.log('\nModel validation completed!');