module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Rely solely on babel-preset-expo, which includes react-native and typescript presets
  };
}; 