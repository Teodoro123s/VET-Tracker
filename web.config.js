// Web compatibility configuration for SDK 54
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure web compatibility
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Web-specific optimizations
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;