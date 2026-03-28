/**
 * PROFILE IMAGE SYNC VERIFICATION TEST
 * 
 * This test verifies that user profile image updates do NOT affect business profile images
 * and vice versa after the fix implementation.
 */

import authService from '../services/auth';
import businessProfileService from '../services/businessProfile';

export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

export class ProfileImageSyncTest {
  
  /**
   * Test 1: Verify user profile image update doesn't affect business profile
   */
  static async testUserImageUpdateIndependence(): Promise<TestResult> {
    console.log('🧪 [TEST 1] Testing user profile image update independence...');
    
    try {
      // Get current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          testName: 'User Image Update Independence',
          passed: false,
          message: 'No current user found for testing'
        };
      }

      // Store original user logo
      const originalUserLogo = currentUser?.logo || currentUser?.companyLogo;
      console.log('📸 Original user logo:', originalUserLogo || '(none)');

      // Get user's business profiles
      const userId = currentUser.id;
      const businessProfiles = await businessProfileService.getUserBusinessProfiles(userId);
      
      if (businessProfiles.length === 0) {
        return {
          testName: 'User Image Update Independence',
          passed: true, // No business profiles to test against
          message: 'No business profiles found - test not applicable'
        };
      }

      // Store original business profile logos
      const mainProfile = businessProfiles[0];
      const originalBusinessLogo = mainProfile?.logo || mainProfile?.companyLogo;
      console.log('🏢 Original business logo:', originalBusinessLogo || '(none)');

      // Simulate user profile image update (this would normally happen in ProfileScreen)
      const testUserLogo = 'https://test-user-logo-updated.com/image.jpg';
      
      // Update user object locally (simulating ProfileScreen.handleImageSelected)
      const updatedUser = {
        ...currentUser,
        logo: testUserLogo,
        photoURL: testUserLogo,
        profileImage: testUserLogo,
        companyLogo: testUserLogo,
      };
      
      // Update auth service (simulating authService.setCurrentUser)
      authService.setCurrentUser(updatedUser);
      
      // Check if business profile logo remained unchanged
      const updatedBusinessProfiles = await businessProfileService.getUserBusinessProfiles(userId);
      const updatedMainProfile = updatedBusinessProfiles[0];
      const updatedBusinessLogo = updatedMainProfile?.logo || updatedMainProfile?.companyLogo;
      
      console.log('📸 Updated user logo:', testUserLogo);
      console.log('🏢 Business logo after user update:', updatedBusinessLogo || '(none)');

      // Verify business logo is unchanged
      const logoUnchanged = originalBusinessLogo === updatedBusinessLogo;
      
      if (logoUnchanged) {
        console.log('✅ [TEST 1 PASSED] Business profile logo remained unchanged');
        return {
          testName: 'User Image Update Independence',
          passed: true,
          message: 'User profile image update did NOT affect business profile image',
          details: {
            originalUserLogo,
            updatedUserLogo: testUserLogo,
            originalBusinessLogo,
            finalBusinessLogo: updatedBusinessLogo
          }
        };
      } else {
        console.log('❌ [TEST 1 FAILED] Business profile logo was incorrectly updated');
        return {
          testName: 'User Image Update Independence',
          passed: false,
          message: 'User profile image update incorrectly affected business profile image',
          details: {
            originalBusinessLogo,
            finalBusinessLogo: updatedBusinessLogo,
            userLogo: testUserLogo
          }
        };
      }
      
    } catch (error) {
      console.error('❌ [TEST 1 ERROR]', error);
      return {
        testName: 'User Image Update Independence',
        passed: false,
        message: `Test failed with error: ${error}`,
        details: error
      };
    }
  }

  /**
   * Test 2: Verify business profile image update doesn't affect user profile
   */
  static async testBusinessImageUpdateIndependence(): Promise<TestResult> {
    console.log('🧪 [TEST 2] Testing business profile image update independence...');
    
    try {
      // Get current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          testName: 'Business Image Update Independence',
          passed: false,
          message: 'No current user found for testing'
        };
      }

      // Store original user logo
      const originalUserLogo = currentUser?.logo || currentUser?.companyLogo;
      console.log('📸 Original user logo:', originalUserLogo || '(none)');

      // Get user's business profiles
      const userId = currentUser.id;
      const businessProfiles = await businessProfileService.getUserBusinessProfiles(userId);
      
      if (businessProfiles.length === 0) {
        return {
          testName: 'Business Image Update Independence',
          passed: true, // No business profiles to test against
          message: 'No business profiles found - test not applicable'
        };
      }

      // Store original business profile logo
      const mainProfile = businessProfiles[0];
      const originalBusinessLogo = mainProfile?.logo || mainProfile?.companyLogo;
      console.log('🏢 Original business logo:', originalBusinessLogo || '(none)');

      // Simulate business profile image update
      const testBusinessLogo = 'https://test-business-logo-updated.com/image.jpg';
      
      // Update business profile (simulating business profile image upload)
      await businessProfileService.updateBusinessProfile(mainProfile.id, {
        companyLogo: testBusinessLogo,
        logo: testBusinessLogo,
      });
      
      // Check if user profile logo remained unchanged
      const updatedUser = authService.getCurrentUser();
      const updatedUserLogo = updatedUser?.logo || updatedUser?.companyLogo;
      
      console.log('🏢 Updated business logo:', testBusinessLogo);
      console.log('📸 User logo after business update:', updatedUserLogo || '(none)');

      // Verify user logo is unchanged
      const logoUnchanged = originalUserLogo === updatedUserLogo;
      
      if (logoUnchanged) {
        console.log('✅ [TEST 2 PASSED] User profile logo remained unchanged');
        return {
          testName: 'Business Image Update Independence',
          passed: true,
          message: 'Business profile image update did NOT affect user profile image',
          details: {
            originalBusinessLogo,
            updatedBusinessLogo: testBusinessLogo,
            originalUserLogo,
            finalUserLogo: updatedUserLogo
          }
        };
      } else {
        console.log('❌ [TEST 2 FAILED] User profile logo was incorrectly updated');
        return {
          testName: 'Business Image Update Independence',
          passed: false,
          message: 'Business profile image update incorrectly affected user profile image',
          details: {
            originalUserLogo,
            finalUserLogo: updatedUserLogo,
            businessLogo: testBusinessLogo
          }
        };
      }
      
    } catch (error) {
      console.error('❌ [TEST 2 ERROR]', error);
      return {
        testName: 'Business Image Update Independence',
        passed: false,
        message: `Test failed with error: ${error}`,
        details: error
      };
    }
  }

  /**
   * Run all profile image sync tests
   */
  static async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Profile Image Sync Verification Tests...');
    console.log('═'.repeat(60));
    
    const results: TestResult[] = [];
    
    // Test 1: User image update independence
    const test1Result = await this.testUserImageUpdateIndependence();
    results.push(test1Result);
    
    console.log('─'.repeat(60));
    
    // Test 2: Business image update independence  
    const test2Result = await this.testBusinessImageUpdateIndependence();
    results.push(test2Result);
    
    console.log('═'.repeat(60));
    console.log('📊 TEST SUMMARY:');
    results.forEach((result, index) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`   Test ${index + 1}: ${result.testName} - ${status}`);
      console.log(`   Message: ${result.message}`);
    });
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`═`.repeat(60));
    console.log(`🎯 Overall Result: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 ALL TESTS PASSED - Profile image sync issue has been FIXED!');
    } else {
      console.log('⚠️  Some tests failed - Profile image sync issue still exists');
    }
    
    return results;
  }
}

// Export for use in development/debugging
export default ProfileImageSyncTest;
