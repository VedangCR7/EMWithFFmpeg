import ApiTestService from './apiTestService';

// Run API tests
const runApiTests = async () => {
  try {
    console.log('🔍 Testing EventMarketers APIs...\n');
    const report = await ApiTestService.runAllTests();
    
    if (!report) {
      console.log('❌ Failed to generate API test report');
      return null;
    }
    
    console.log('\n🎯 Final Report:');
    console.log('================');
    
    if (report.notWorking.length > 0) {
      console.log('\n❌ APIs NOT WORKING:');
      report.notWorking.forEach((api: any) => {
        console.log(`  • ${api.name}: ${api.message}`);
      });
    } else {
      console.log('\n🎉 All APIs are working!');
    }
    
    console.log(`\n📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`   Working: ${report.summary.working}/${report.summary.total}`);
    
    return report;
  } catch (error) {
    console.error('❌ Error running API tests:', error);
    return null;
  }
};

// Export for use in other files
export { runApiTests };
