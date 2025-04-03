import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Mock console methods
const mockConsole = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};

Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true,
});

beforeAll(() => {
  // Reset all mocks before tests
  vi.clearAllMocks();
});

beforeEach(() => {
  // Mock ReactNativeWebView for each test
  Object.defineProperty(window, 'ReactNativeWebView', {
    value: {
      postMessage: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  // Clean up ReactNativeWebView mock
  delete window.ReactNativeWebView;
  vi.clearAllMocks();
});

afterAll(() => {
  // Clean up after tests
  vi.restoreAllMocks();
}); 