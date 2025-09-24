# FFmpeg Downgrade Migration Guide

## ⚠️ Important Notice
FFmpeg Kit has been officially retired as of January 6, 2025. Consider alternative solutions for long-term projects.

## Migration Steps

### Step 1: Backup Current Project
```bash
# Create backup
cp -r EventMarketersWorking EventMarketersWorking_backup
```

### Step 2: Clean Current Installation
```bash
# Remove node_modules and lock files
rm -rf node_modules
rm package-lock.json
rm -rf android/build
rm -rf android/app/build
rm -rf ios/build
rm -rf ios/Pods
rm ios/Podfile.lock
```

### Step 3: Update Package.json
Replace your current `package.json` with the downgraded version:
```bash
cp package.json.downgrade package.json
```

### Step 4: Update Android Configuration
Replace Android build files:
```bash
cp android/build.gradle.downgrade android/build.gradle
cp android/app/build.gradle.downgrade android/app/build.gradle
```

### Step 5: Install Dependencies
```bash
npm install
```

### Step 6: iOS Configuration
```bash
cd ios
pod install
cd ..
```

### Step 7: Clean and Rebuild
```bash
# Android
cd android
./gradlew clean
cd ..

# iOS
cd ios
xcodebuild clean
cd ..

# React Native
npx react-native start --reset-cache
```

### Step 8: Test FFmpeg Integration
Create a test file to verify FFmpeg works:

```typescript
// src/services/ffmpegTest.ts
import { FFmpegKit } from 'ffmpeg-kit-react-native';

export const testFFmpeg = async () => {
  try {
    console.log('Testing FFmpeg Kit...');
    
    // Test basic FFmpeg command
    const result = await FFmpegKit.execute('-version');
    
    if (result.getReturnCode().isValueSuccess()) {
      console.log('✅ FFmpeg Kit is working!');
      console.log('FFmpeg version:', result.getOutput());
      return true;
    } else {
      console.error('❌ FFmpeg Kit test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ FFmpeg Kit error:', error);
    return false;
  }
};
```

## Alternative Solutions (Recommended)

### Option 1: FFmpeg Web Assembly
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

### Option 2: Community Fork
```bash
npm install @spreen/ffmpeg-kit-react-native
```

### Option 3: Native Video Processing
- Use AVFoundation (iOS) + MediaCodec (Android)
- Implement custom native modules
- Use react-native-video-processing

## Version Compatibility Matrix

| React Native | FFmpeg Kit | Status |
|---------------|------------|--------|
| 0.71.8        | 5.1.0      | ✅ Stable |
| 0.72.6        | 5.1.0      | ✅ Stable |
| 0.73.0        | 6.0.2      | ✅ Stable |
| 0.80.2        | 6.0.2      | ⚠️ Deprecated |

## Troubleshooting

### Common Issues:
1. **Metro bundler cache**: Use `--reset-cache` flag
2. **Android build issues**: Clean gradle cache
3. **iOS pod issues**: Delete Podfile.lock and reinstall
4. **FFmpeg not found**: Check native linking

### Rollback Plan:
If downgrade fails, restore from backup:
```bash
rm -rf EventMarketersWorking
mv EventMarketersWorking_backup EventMarketersWorking
```
