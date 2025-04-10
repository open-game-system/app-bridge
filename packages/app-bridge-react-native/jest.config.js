/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo', // Use the preset
  // testEnvironment is handled by the preset
  // transform is handled by the preset
  setupFilesAfterEnv: ['./src/test/setup.ts'], // Keep custom setup for webview mock
  transformIgnorePatterns: [
    // Try simpler pattern mentioned in nx issue #17589
    'node_modules/(?!react-native)/', 
    'jest-runner'
  ]
}; 