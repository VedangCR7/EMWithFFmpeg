// Simple validation script for our models
const fs = require('fs');
const path = require('path');

console.log('Validating Model Files...\n');

const modelsDir = path.join(__dirname, 'src', 'models');
const testDir = path.join(modelsDir, '__tests__');

// Check if models directory exists
if (!fs.existsSync(modelsDir)) {
  console.log('✗ Models directory not found');
  process.exit(1);
}

console.log('✓ Models directory exists');

// Check if model files exist
const modelFiles = ['User.ts', 'Video.ts', 'Greeting.ts'];
let modelFilesExist = true;

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} exists`);
    // Basic content check
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('export') && content.includes('class')) {
      console.log(`✓ ${file} contains class definition`);
    } else {
      console.log(`✗ ${file} missing class definition`);
      modelFilesExist = false;
    }
  } else {
    console.log(`✗ ${file} not found`);
    modelFilesExist = false;
  }
});

// Check if test directory exists
if (!fs.existsSync(testDir)) {
  console.log('✗ Test directory not found');
  process.exit(1);
}

console.log('\n✓ Test directory exists');

// Check if test files exist
const testFiles = ['User.test.ts', 'Video.test.ts', 'Greeting.test.ts', 'ModelIntegration.test.ts', 'ModelValidation.test.ts', 'ModelUtils.test.ts'];
let testFilesExist = true;

testFiles.forEach(file => {
  const filePath = path.join(testDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} exists`);
    // Basic content check
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('describe(') && content.includes('test(')) {
      console.log(`✓ ${file} contains test definitions`);
    } else {
      console.log(`✗ ${file} missing test definitions`);
      testFilesExist = false;
    }
  } else {
    console.log(`✗ ${file} not found`);
    testFilesExist = false;
  }
});

console.log('\nValidation Summary:');
console.log(`Models: ${modelFilesExist ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Tests: ${testFilesExist ? '✓ PASS' : '✗ FAIL'}`);

if (modelFilesExist && testFilesExist) {
  console.log('\n🎉 All validations passed! Models and tests are ready.');
  process.exit(0);
} else {
  console.log('\n❌ Some validations failed.');
  process.exit(1);
}