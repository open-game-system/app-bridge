# Testing Strategies for App Bridge

This document outlines strategies for testing applications that use the app-bridge, with a focus on the core functionality.

## Table of Contents

- [Testing the Native Side](#testing-the-native-side)
- [Testing the Web Side](#testing-the-web-side)
- [Testing User-Visible Functionality](#testing-user-visible-functionality)
- [Testing WebView Store Integration](#testing-webview-store-integration)
- [Using the Mock Bridge](#using-the-mock-bridge)

## Testing the Native Side

When testing components that use the native bridge, you'll typically want to:

1. Mock the bridge to provide predetermined responses
2. Verify that components respond appropriately to state changes
3. Verify that events are dispatched as expected

### Basic Bridge Mocking

```typescript
import { createNativeBridge } from '@open-game-system/app-bridge/native';

// Mock createNativeBridge to return a controlled instance
jest.mock('@open-game-system/app-bridge/native', () => ({
  createNativeBridge: jest.fn(() => ({
    getStore: jest.fn(() => ({
      getSnapshot: jest.fn(() => ({ value: 0 })),
      subscribe: jest.fn((callback) => {
        callback({ value: 0 });
        return jest.fn(); // unsubscribe function
      })
    })),
    registerWebView: jest.fn(() => jest.fn()), // Return unregister function
    produce: jest.fn(),
    setState: jest.fn()
  }))
}));
```

## Testing the Web Side

When testing components that use the web bridge, you'll typically:

1. Use the `createMockBridge` utility
2. Provide test data via the mock bridge
3. Verify component behavior with the test data

### Using createMockBridge

```typescript
import { render } from '@testing-library/react';
import { createMockBridge, createBridgeContext } from '@open-game-system/app-bridge';
import type { AppStores } from './types';

// Create mock bridge with initial state
const mockBridge = createMockBridge<AppStores>({
  initialState: {
    counter: { value: 0 }
  }
});

// Create context with the mock bridge
const TestBridgeContext = createBridgeContext<AppStores>();
const TestCounterContext = TestBridgeContext.createStoreContext('counter');

// Render component with the test context
const { getByText } = render(
  <TestBridgeContext.Provider bridge={mockBridge}>
    <TestCounterContext.Provider>
      <Counter />
    </TestCounterContext.Provider>
  </TestBridgeContext.Provider>
);
```

## Testing User-Visible Functionality

In many cases, it's best to focus on testing the user-visible functionality rather than implementation details. This approach ensures that:

1. Tests remain stable even when implementation details change
2. Your tests verify what users actually care about
3. Code refactoring doesn't break tests unnecessarily

### Focusing on What Users See

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('displays the counter and responds to user interactions', () => {
    // Render the App
    const { getByText } = render(<App />);
    
    // Verify elements are visible
    expect(getByText('Counter: 0')).toBeTruthy();
    expect(getByText('+')).toBeTruthy();
    expect(getByText('-')).toBeTruthy();
    
    // Test user interactions
    fireEvent.press(getByText('+'));
    expect(getByText('Counter: 1')).toBeTruthy();
    
    fireEvent.press(getByText('-'));
    expect(getByText('Counter: 0')).toBeTruthy();
  });
  
  it('renders the WebView component', () => {
    const { UNSAFE_getAllByType } = render(<App />);
    
    // Verify WebView is rendered without testing implementation details
    const webViews = UNSAFE_getAllByType(WebView);
    expect(webViews.length).toBeGreaterThan(0);
  });
});
```

### Benefits of Testing User-Visible Functionality

1. **Resilience to Change**: Tests continue to work even if you modify internal implementation
2. **User-Centered**: Tests focus on the actual user experience
3. **Simpler Tests**: Tests are often easier to write and understand
4. **Better Maintainability**: Less need to update tests when refactoring code

### When to Use Implementation Testing

While focusing on user-visible functionality is often best, there are cases where testing implementation details is valuable:

1. Complex state management logic that needs verification
2. Critical internal algorithms or processes
3. Edge cases that are difficult to trigger through the UI

The app-bridge offers tools for both approaches, letting you choose the right testing strategy for each situation.

## Testing WebView Store Integration

When testing the integration between native and web via WebView, focus on verifying that the native store correctly synchronizes with the WebView. This requires creating a mock WebView that can capture messages sent from native and simulate messages from web.

### Simple WebView Mock for Testing

```typescript
// Define a type for our mocked WebView
interface MockWebViewStatic {
  sentMessages: any[];
  onMessageHandler?: (event: { nativeEvent: { data: string } }) => void;
  simulateMessage: (message: any) => void;
}

// Create a mock WebView for testing
jest.mock('react-native-webview', () => {
  const React = require('react');
  
  class MockWebView extends React.Component {
    static sentMessages: any[] = [];
    static onMessageHandler?: (event: { nativeEvent: { data: string } }) => void;
    
    constructor(props: any) {
      super(props);
      MockWebView.sentMessages = [];
      
      if (props.onMessage) {
        MockWebView.onMessageHandler = props.onMessage;
      }
    }
    
    // Record messages sent to the WebView
    postMessage(message: string) {
      MockWebView.sentMessages.push(JSON.parse(message));
    }
    
    // Method to simulate messages from WebView to native
    static simulateMessage(message: any) {
      if (MockWebView.onMessageHandler) {
        MockWebView.onMessageHandler({
          nativeEvent: {
            data: typeof message === 'string' ? message : JSON.stringify(message)
          }
        });
      }
    }
    
    render() {
      return React.createElement('div', this.props, this.props.children);
    }
  }
  
  return {
    __esModule: true,
    default: MockWebView
  };
});
```

### Core Integration Tests

To test the core bridge functionality, focus on these three key aspects:

1. **State Initialization**: Verify the native store's state is sent to the WebView
   ```typescript
   it('initializes the WebView with store state', async () => {
     render(<App />);
     
     // Simulate WebView ready
     await act(async () => {
       MockedWebView.simulateMessage({ type: 'WEBVIEW_READY' });
       await new Promise(resolve => setTimeout(resolve, 0));
     });
     
     // Check messages sent to WebView
     const stateInitMsg = MockedWebView.sentMessages.find(
       msg => msg.type === 'STATE_INIT' && msg.storeKey === 'counter'
     );
     
     expect(stateInitMsg).toBeDefined();
     expect(stateInitMsg.data).toHaveProperty('value');
   });
   ```

2. **State Updates**: Verify changes in the native store are sent to WebView
   ```typescript
   it('sends state updates to WebView', async () => {
     const { getByText } = render(<App />);
     
     // Simulate WebView ready
     await act(async () => {
       MockedWebView.simulateMessage({ type: 'WEBVIEW_READY' });
       await new Promise(resolve => setTimeout(resolve, 0));
     });
     
     // Clear messages
     MockedWebView.sentMessages = [];
     
     // Trigger state change in native
     fireEvent.press(getByText('+'));
     
     // Check for state update message
     const updateMsg = MockedWebView.sentMessages.find(
       msg => msg.type === 'STATE_UPDATE' && msg.storeKey === 'counter'
     );
     
     expect(updateMsg).toBeDefined();
     expect(updateMsg.operations).toBeDefined();
   });
   ```

3. **Event Processing**: Verify events from WebView update the native store
   ```typescript
   it('processes events from WebView', async () => {
     const { getByText } = render(<App />);
     
     // Simulate WebView ready
     await act(async () => {
       MockedWebView.simulateMessage({ type: 'WEBVIEW_READY' });
       await new Promise(resolve => setTimeout(resolve, 0));
     });
     
     // Initial state check
     expect(getByText('Native Counter: 0')).toBeTruthy();
     
     // Simulate WebView sending event
     await act(async () => {
       MockedWebView.simulateMessage({
         type: 'EVENT',
         storeKey: 'counter',
         event: { type: 'INCREMENT' }
       });
       await new Promise(resolve => setTimeout(resolve, 0));
     });
     
     // Verify store was updated
     expect(getByText('Native Counter: 1')).toBeTruthy();
   });
   ```

## Using the Mock Bridge

The app-bridge provides a `createMockBridge` utility specifically for testing:

```typescript
import { createMockBridge } from '@open-game-system/app-bridge';
import type { AppStores } from './types';

describe('Counter Component', () => {
  let mockBridge;
  
  beforeEach(() => {
    // Create a fresh mock bridge for each test
    mockBridge = createMockBridge<AppStores>({
      initialState: {
        counter: { value: 0 }
      }
    });
  });
  
  it('maintains event history', () => {
    // Get the counter store
    const counterStore = mockBridge.getStore('counter');
    
    // Dispatch an event
    counterStore?.dispatch({ type: 'INCREMENT' });
    
    // Check event history
    const history = mockBridge.getHistory('counter');
    expect(history).toEqual([{ type: 'INCREMENT' }]);
  });
  
  it('allows direct state manipulation', () => {
    // Set state directly
    mockBridge.setState('counter', { value: 42 });
    
    // Get the counter store
    const counterStore = mockBridge.getStore('counter');
    expect(counterStore?.getSnapshot().value).toBe(42);
  });
});
```

For complete examples of testing strategies, see the test files in the example apps:
- `examples/expo-app/__tests__/AppBridge-test.tsx`: For React Native with WebView example
- `examples/react-app/src/__tests__/`: For React web testing examples