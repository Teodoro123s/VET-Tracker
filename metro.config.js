const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Web-specific configuration for mobile simulation
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

module.exports = config;
