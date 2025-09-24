const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Exclude FFmpeg Kit native binaries from bundling
    blockList: [
      /ffmpeg-kit-main\/.*\.so$/,
      /ffmpeg-kit-main\/.*\.a$/,
      /ffmpeg-kit-main\/.*\.dylib$/,
    ],
    // Add support for additional file extensions
    assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'gif', 'webp', 'svg', 'mp4', 'mov', 'avi', 'mkv'],
  },
  transformer: {
    // Optimize for large projects
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
  // Increase memory limits
  maxWorkers: 2,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
