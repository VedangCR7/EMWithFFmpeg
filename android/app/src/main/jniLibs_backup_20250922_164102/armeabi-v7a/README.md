# FFmpeg Native Libraries Directory

## Current Status: FFmpegKit Retired
As of January 6, 2025, FFmpegKit has been officially retired and binaries are no longer available.

## Required Libraries for armeabi-v7a:
- libffmpegkit_abidetect.so
- libffmpegkit.so
- libavcodec.so
- libavformat.so
- libavutil.so
- libswresample.so
- libswscale.so

## Solutions:
1. **Build from source**: Use `android.sh` script in Linux/WSL environment
2. **Use alternative**: Switch to react-native-video-processing or similar
3. **Host binaries**: Set up your own repository with FFmpeg binaries

## Current Workaround:
The app is configured to run without FFmpeg until native libraries are available.

