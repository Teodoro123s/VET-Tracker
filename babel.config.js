module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-class-static-block',
      [
        'module-resolver',
        {
          alias: {
            '@': './',
          },
        },
      ],
      // react-native-reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
  };
};