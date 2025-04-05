// Mock for @react-native/js-polyfills/error-guard
jest.mock('@react-native/js-polyfills/error-guard', () => ({
  ErrorUtils: {
    setGlobalHandler: jest.fn(),
    reportError: jest.fn(),
  }
}));

// Mock WebView implementation
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  const MockWebView = (props) => {
    return <View {...props} />;
  };
  MockWebView.displayName = 'WebView';
  
  return {
    __esModule: true,
    default: MockWebView,
  };
});

// Mock the react-native Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(obj => obj.ios)
}));

// Mock additional React Native modules that might cause issues
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock the NativeModules
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
  UIManager: {
    RCTView: () => {},
  },
  PlatformConstants: {
    getConstants: () => ({
      isTesting: true
    })
  },
  StatusBarManager: {
    getHeight: jest.fn(),
  },
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}; 