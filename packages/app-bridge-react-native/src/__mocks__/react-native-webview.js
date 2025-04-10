import React from 'react';

// Define the actual mock implementation using forwardRef
const MockWebViewComponent = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    postMessage: jest.fn(),
    injectJavaScript: jest.fn(),
    reload: jest.fn(),
  }));
  // Render null or a simple element like Text
  return <text>MockWebView</text>; // Using lowercase 'text' as placeholder
});

// Use jest.fn() on the component directly
export const WebView = jest.fn(MockWebViewComponent);

// Mock any other exports if necessary
// export const otherExport = jest.fn(); 