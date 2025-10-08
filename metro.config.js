const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for SDK 54 compatibility
config.resolver.unstable_enablePackageExports = false;

// Platform support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Alias support
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
};

// Exclude AWS SDK from web bundling
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.blockList = [
  /node_modules\/@aws-sdk\/.*/, // Block all AWS SDK packages
];

// Fix transformer settings for web
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  // Fix for web bundling
  unstable_allowRequireContext: true,
};

// Asset extensions
config.resolver.assetExts = [...config.resolver.assetExts, 'svg'];

// Source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx', 'js', 'jsx'];

module.exports = config;