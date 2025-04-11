import React, { forwardRef, useImperativeHandle } from 'react';

// Import the actual (mocked by jest-expo) View
const View = require('react-native').View;

// Define the mock methods we need
const mockWebViewRefMethods = {
  reload: jest.fn(),
  postMessage: jest.fn(),
  injectJavaScript: jest.fn(),
  // Add other methods if your component uses them
};

// Create the mock component using forwardRef
const MockWebViewComponent = forwardRef((props, ref) => {
  // Expose mock methods via useImperativeHandle
  useImperativeHandle(ref, () => (mockWebViewRefMethods));

  // Simulate onLoadEnd or other events if needed by tests
  // useEffect(() => {
  //   props.onLoadEnd?.();
  // }, [props.onLoadEnd]);

  // Render a simple View to act as the placeholder
  return <View {...props} />; 
});

// Export the component directly
export const WebView = MockWebViewComponent;

// Optionally, attach mocks statically if needed for other types of assertions,
// but rely on useImperativeHandle for ref testing.
// Object.assign(WebView, mockWebViewRefMethods);

// Mock any other exports from the original module if necessary
// export const otherExport = jest.fn(); 