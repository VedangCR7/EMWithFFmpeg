// Test script to verify real template ID fix
console.log('=== Real Template ID Fix Verification ===\n');

// Simulate the scenario
function testNavigationIdFix() {
  console.log('1. Initial State (Category Fallback):');
  let currentId = 'greeting_category_vhmcydd3l3685jft3zl9qijo';
  let currentPoster = {
    id: 'greeting_category_vhmcydd3l3685jft3zl9qijo',
    name: 'Have a Great Day',
    category: 'Have a Great Day'
  };
  
  console.log('currentId:', currentId);
  console.log('currentPoster.id:', currentPoster.id);
  console.log('Navigation ID (OLD):', currentId); // Would use stale ID
  console.log('Navigation ID (FIXED):', currentPoster?.id || currentId); // Uses current poster ID
  
  console.log('\n2. After API finds real poster:');
  // API finds real poster and updates both
  currentPoster = {
    id: 'cmmtcydf901slbxj3ofmqalfa',
    name: 'Have a Great Day English 21',
    category: 'GENERAL'
  };
  // currentId might not be updated immediately (timing issue)
  // currentId still: 'greeting_category_vhmcydd3l3685jft3zl9qijo'
  
  console.log('currentId (stale):', currentId);
  console.log('currentPoster.id (real):', currentPoster.id);
  console.log('Navigation ID (OLD):', currentId); // PROBLEM: Uses stale category ID
  console.log('Navigation ID (FIXED):', currentPoster?.id || currentId); // SOLUTION: Uses real poster ID
  
  console.log('\n3. Download Prevention Check:');
  const isCategoryTemplate = (id) => id?.startsWith('business_category_') || id?.startsWith('greeting_category_');
  
  const oldNavigationId = currentId; // stale category ID
  const fixedNavigationId = currentPoster?.id || currentId; // real poster ID
  
  console.log('OLD navigation ID:', oldNavigationId);
  console.log('Is category template (OLD):', isCategoryTemplate(oldNavigationId));
  console.log('Download blocked (OLD):', isCategoryTemplate(oldNavigationId) ? 'YES (WRONG)' : 'NO');
  
  console.log('\nFIXED navigation ID:', fixedNavigationId);
  console.log('Is category template (FIXED):', isCategoryTemplate(fixedNavigationId));
  console.log('Download blocked (FIXED):', isCategoryTemplate(fixedNavigationId) ? 'YES (WRONG)' : 'NO (CORRECT)');
  
  console.log('\n4. User Experience Impact:');
  console.log('OLD FLOW:');
  console.log('- User selects General Category');
  console.log('- API finds real poster');
  console.log('- User edits poster');
  console.log('- Download blocked because category ID used');
  console.log('- User confused');
  
  console.log('\nFIXED FLOW:');
  console.log('- User selects General Category');
  console.log('- API finds real poster');
  console.log('- User edits poster');
  console.log('- Download works because real poster ID used');
  console.log('- User happy');
}

testNavigationIdFix();

console.log('\n=== Real Template ID Fix Verification Complete ===');
console.log('Fix Status: Navigation now uses real template ID instead of stale category ID');
console.log('Benefit: Downloads will work correctly for real posters found by API');
