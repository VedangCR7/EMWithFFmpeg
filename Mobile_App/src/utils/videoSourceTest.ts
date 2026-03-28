import { getVideoSource, getVideoComponentSource, getNativeVideoSource } from '../utils/videoSourceHelper';

/**
 * Test the video source helper functions
 */
export const testVideoSourceHelper = async () => {
  console.log('🧪 Testing Video Source Helper...');
  
  try {
    // Test basic video source
    console.log('\n1. Testing getVideoSource():');
    const basicSource = await getVideoSource();
    console.log('✅ Basic source result:', basicSource);
    
    // Test video component source
    console.log('\n2. Testing getVideoComponentSource():');
    const componentSource = await getVideoComponentSource();
    console.log('✅ Component source result:', componentSource);
    
    // Test native video source (this is the important one for VideoComposer)
    console.log('\n3. Testing getNativeVideoSource():');
    const nativeSource = await getNativeVideoSource();
    console.log('✅ Native source result:', nativeSource);
    console.log('📁 Is file:// path:', nativeSource.startsWith('file://'));
    
    // Test with custom config
    console.log('\n4. Testing with custom config:');
    const customSource = await getVideoSource({
      fileName: 'test',
      useRemote: false,
    });
    console.log('✅ Custom source result:', customSource);
    
    // Test native source with remote fallback (Big Buck Bunny)
    console.log('\n5. Testing native source with remote fallback:');
    const remoteNativeSource = await getNativeVideoSource({
      fileName: 'test',
      useRemote: true,
    });
    console.log('✅ Remote native source result:', remoteNativeSource);
    console.log('📁 Is file:// path:', remoteNativeSource.startsWith('file://'));
    
    console.log('\n🎉 All video source tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Video source test failed:', error);
    return false;
  }
};

/**
 * Debug video source information
 */
export const debugVideoSource = async () => {
  console.log('🔍 Debugging Video Source Information...');
  
  try {
    const source = await getVideoSource();
    console.log('📊 Video Source Debug Info:');
    console.log('- URI:', source.uri);
    console.log('- Is Local:', source.isLocal);
    console.log('- Source Type:', source.sourceType);
    console.log('- Error:', source.error || 'None');
    
    return source;
  } catch (error) {
    console.error('🚨 Debug failed:', error);
    return null;
  }
};
