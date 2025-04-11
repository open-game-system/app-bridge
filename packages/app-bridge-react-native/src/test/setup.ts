/// <reference types="jest" />

import '@testing-library/react-native';
import '@testing-library/jest-dom';

// --- Global Mocks ---

// Core React Native mocks are now handled by the `jest-expo` preset

// react-native-webview is now handled by the manual mock in src/__mocks__
// jest.mock('react-native-webview', () => {
//   const React = require('react');
// 
//   // Minimal forwardRef component that accepts ref and renders null
//   const MockWebViewComponent = React.forwardRef((_props: any, ref: any) => {
//     // Provide the expected imperative handle methods
//     React.useImperativeHandle(ref, () => ({
//       postMessage: jest.fn(),
//       injectJavaScript: jest.fn(),
//       reload: jest.fn(), 
//     }));
//     // Render null to be absolutely minimal
//     return null; 
//   });
// 
//   // Create the mock function wrapping the minimal component
//   const MockWebView = jest.fn().mockImplementation(MockWebViewComponent);
// 
//   return { WebView: MockWebView };
// });

// Mock ErrorUtils globally (Keep for now)
(globalThis as any).ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(),
};

// Suppress specific console warnings (Keep for now)
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const warningsToSuppress = [
    'Animated: `useNativeDriver`',
    'Warning: componentWillReceiveProps',
    'Warning: componentWillMount',
    // Suppress the ref warning if it persists, though ideally forwardRef fixes it
    // 'Warning: Function components cannot be given refs', 
  ];
  const shouldSuppress = warningsToSuppress.some(warning =>
    args[0]?.includes?.(warning)
  );
  if (!shouldSuppress) {
    originalWarn.apply(console, args);
  }
}; 