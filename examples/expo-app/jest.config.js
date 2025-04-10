module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|@react-native/js-polyfills|@react-native|react-native|@react-native-community|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@open-game-system/.*))'
  ],
  setupFiles: [
    './jest.setup.js'
  ],
  moduleDirectories: ['node_modules', '.pnpm'],
  moduleNameMapper: {
    '^@open-game-system/(.*)$': '<rootDir>/../../packages/$1/src'
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js'
  ],
  snapshotSerializers: []
}; 