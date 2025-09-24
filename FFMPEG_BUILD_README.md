# FFmpeg Build Scripts for drawtext Filter Support

This directory contains scripts to build FFmpeg with full support for the `drawtext` filter, which is required for text overlay functionality in your React Native video processing app.

## Problem
The current FFmpeg build in your project doesn't include the `drawtext` filter, causing the error:
```
[AVFilterGraph @ 0x96076100] No such filter: 'drawtext'
```

## Solution
Build FFmpeg with the required libraries: `freetype`, `fontconfig`, `libpng`, `expat`, and `libiconv`.

## Files Created

### 1. `setup_linux_environment.sh`
Sets up the Linux environment with Android SDK and NDK.

### 2. `build_ffmpeg_full.sh` (Recommended)
Builds FFmpeg with ALL available libraries for maximum compatibility.

### 3. `build_ffmpeg_with_drawtext.sh`
Builds FFmpeg with only the specific libraries needed for drawtext.

## Quick Start (Linux)

1. **Setup Environment:**
   ```bash
   chmod +x setup_linux_environment.sh
   ./setup_linux_environment.sh
   ```

2. **Install Android SDK Components:**
   ```bash
   ~/android/sdk/cmdline-tools/latest/bin/sdkmanager --install 'platform-tools' 'platforms;android-33' 'build-tools;33.0.0' 'ndk;25.2.9519653'
   ```

3. **Restart Terminal:**
   ```bash
   source ~/.bashrc
   ```

4. **Build FFmpeg:**
   ```bash
   chmod +x build_ffmpeg_full.sh
   ./build_ffmpeg_full.sh
   ```

## Alternative: Minimal Build

If you prefer a smaller build with only the required libraries:

```bash
chmod +x build_ffmpeg_with_drawtext.sh
./build_ffmpeg_with_drawtext.sh
```

## What These Scripts Do

### `setup_linux_environment.sh`
- Checks for required tools (wget, unzip, java)
- Downloads Android SDK command line tools
- Sets up environment variables
- Provides next steps

### `build_ffmpeg_full.sh`
- Builds FFmpeg with ALL available libraries
- Includes freetype, fontconfig, and all other libraries
- Maximum compatibility and functionality
- Build time: 60-120 minutes

### `build_ffmpeg_with_drawtext.sh`
- Builds FFmpeg with only required libraries for drawtext
- Includes: fontconfig, freetype, libpng, expat, libiconv
- Smaller build size
- Build time: 30-60 minutes

## After Building

1. **Copy Build Artifacts:**
   The scripts will create `.aar` files in the `prebuilt` directory.

2. **Update Your Android Project:**
   Replace the existing FFmpeg libraries with the new ones.

3. **Test the drawtext Filter:**
   Your video processing should now work without the "No such filter" error.

## Troubleshooting

### Build Fails
- Check `build.log` for detailed error messages
- Ensure all environment variables are set correctly
- Verify Android SDK and NDK are properly installed

### Environment Variables Not Set
```bash
export ANDROID_SDK_ROOT=~/android/sdk
export ANDROID_NDK_ROOT=~/android/sdk/ndk/25.2.9519653
```

### Permission Denied
```bash
chmod +x *.sh
```

## Expected Output

After successful build, you should see:
- `prebuilt` directory with `.aar` files
- FFmpeg configuration includes `--enable-libfreetype --enable-libfontconfig`
- No more "No such filter: 'drawtext'" errors

## Notes

- The full build (`build_ffmpeg_full.sh`) is recommended for maximum compatibility
- Build time depends on your system (30-120 minutes)
- Ensure you have sufficient disk space (several GB)
- The build process requires internet connection for downloading dependencies
