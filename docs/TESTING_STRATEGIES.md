# 🧪 Testing Strategies

## Overview

This document outlines testing strategies for the app-bridge package, focusing on:

1. Unit testing
2. Integration testing
3. Component testing
4. Mock bridge usage

## Testing Approaches

### Unit Testing

Test individual functions and utilities:

```typescript
describe('Bridge', () => {
  test('initializes with correct state', () => {
    // Web Bridge
    const webBridge = createBridge<AppStores>();
    expect(webBridge.getSnapshot().counter).toBeNull();

    // Native Bridge
    const nativeBridge = createNativeBridge<AppStores>({
      initialState: {
        counter: { value: 0 }
      }
    });
    expect(nativeBridge.getSnapshot().counter).toEqual({ value: 0 });
  });

  test('handles store initialization states', () => {
    const bridge = createMockBridge<AppStores>({
      stores: {
        counter: { value: 0 }
      }
    });

    // Test uninitialization
    bridge.reset('counter');
    expect(bridge.getSnapshot().counter).toBeNull();

    // Test resetting to initial state
    bridge.reset();
    expect(bridge.getSnapshot().counter).toEqual({ value: 0 });
  });

  test('handles events correctly', () => {
    const bridge = createMockBridge<AppStores>({
      stores: {
        counter: { value: 0 }
      }
    });

    bridge.dispatch('counter', { type: "INCREMENT" });
    expect(bridge.getSnapshot().counter).toEqual({ value: 1 });
  });
});
```

### Integration Testing

Test bridge interactions:

```typescript
describe('Bridge Integration', () => {
  test('syncs state between stores', () => {
    const bridge = createMockBridge<AppStores>({
      stores: {
        counter: {
          initialState: { value: 0 },
          reducers: {
            INCREMENT: (state) => {
              state.value += 1;
            }
          }
        },
        user: {
          initialState: { name: "Test" },
          reducers: {
            SET_NAME: (state, event) => {
              state.name = event.name;
            }
          }
        }
      }
    });

    bridge.dispatch('counter', { type: "INCREMENT" });
    bridge.dispatch('user', { type: "SET_NAME", name: "New Name" });

    expect(bridge.getSnapshot()).toEqual({
      counter: { value: 1 },
      user: { name: "New Name" }
    });
  });
});
```

### Testing Store Lifecycle

```typescript
describe('Store Lifecycle', () => {
  let mockBridge: MockBridge<AppStores>;

  beforeEach(() => {
    // Create mock bridge with initial state and reducers
    mockBridge = createMockBridge<AppStores>({
      stores: {
        counter: {
          initialState: { value: 0 },
          reducers: {
            INCREMENT: (state) => { state.value += 1; }
          }
        },
        user: {
          initialState: { name: 'Test' }
        }
      }
    });
  });

  test('handles initialization states correctly', () => {
    // Test initial state
    expect(mockBridge.getSnapshot()).toEqual({
      counter: { value: 0 },
      user: { name: 'Test' }
    });

    // Test uninitializing a store (mock bridge specific)
    mockBridge.uninitialize('counter');
    expect(mockBridge.getSnapshot().counter).toBeNull();
    expect(mockBridge.getSnapshot().user).toEqual({ name: 'Test' });

    // Test resetting all stores (mock bridge specific)
    mockBridge.reset();
    expect(mockBridge.getSnapshot()).toEqual({
      counter: { value: 0 },
      user: { name: 'Test' }
    });
  });

  test('handles component initialization correctly', () => {
    // Start with uninitialized store
    mockBridge.uninitialize('counter');

    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <CounterContext.Initializing>
          <div>Loading...</div>
        </CounterContext.Initializing>
        <CounterContext.Initialized>
          <CounterComponent />
        </CounterContext.Initialized>
      </BridgeContext.Provider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Initialize the store
    mockBridge.produce('counter', draft => {
      draft.value = 0;
    });

    // Should now show the counter
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  test('handles cleanup between tests', () => {
    // Modify state
    mockBridge.dispatch('counter', { type: 'INCREMENT' });
    expect(mockBridge.getSnapshot().counter).toEqual({ value: 1 });

    // Reset for next test (mock bridge specific)
    mockBridge.reset();
    expect(mockBridge.getSnapshot().counter).toEqual({ value: 0 });
  });
});
```

### Choosing Between Reset and Uninitialize

When testing store lifecycle, choose between `reset()` and `uninitialize()` based on your testing needs:

1. Use `reset()` when:
   - You need to restore ALL stores to their initial state from when createMockBridge was called
   - You're cleaning up between tests
   - You want to start fresh with known state
   - You're testing store initialization from scratch
   - Note: This is specific to the mock bridge and resets to the initial state from config.stores

2. Use `uninitialize()` when:
   - You're testing a single store's initialization handling
   - You want to simulate a store becoming unavailable
   - You're testing component behavior with uninitialized stores
   - You need to test cleanup of specific stores

### Component Testing

Test React components:

```typescript
describe('Component Integration', () => {
  test('handles store selection correctly', () => {
    const bridge = createMockBridge<AppStores>({
      stores: {
        counter: { value: 0 }
      }
    });

    function TestComponent() {
      // Using store-specific context
      const counterValue = CounterContext.useSelector(state => state.value);
      const dispatch = CounterContext.useDispatch();

      // Using bridge-level selector
      const userName = BridgeContext.useSelector('user', state => state.name);

      return (
        <div>
          <p>Count: {counterValue}</p>
          <p>User: {userName}</p>
          <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
        </div>
      );
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <TestComponent />
      </BridgeContext.Provider>
    );

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    expect(screen.getByText('User: Test')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  test('handles uninitialized stores', () => {
    const bridge = createMockBridge<AppStores>({
      stores: {
        counter: { value: 0 }
      }
    });

    // Uninitialize the counter store
    bridge.reset('counter');

    function TestComponent() {
      const value = BridgeContext.useSelector('counter', state => state?.value ?? 0);
      return <div>Count: {value}</div>;
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <TestComponent />
      </BridgeContext.Provider>
    );

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  test('handles initialization states', () => {
    const bridge = createMockBridge<AppStores>({
      stores: {
        counter: { value: 0 }
      }
    });

    // Start with uninitialized store
    bridge.reset('counter');

    function TestComponent() {
      return (
        <>
          <CounterContext.Initializing>
            <div>Loading...</div>
          </CounterContext.Initializing>
          <CounterContext.Initialized>
            <div>Ready!</div>
          </CounterContext.Initialized>
        </>
      );
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <TestComponent />
      </BridgeContext.Provider>
    );

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Ready!')).not.toBeInTheDocument();

    // Initialize the store
    bridge.dispatch('counter', { type: 'SET', value: 0 });

    // Now shows ready
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Ready!')).toBeInTheDocument();
  });

  test('handles bridge support states', () => {
    const bridge = createMockBridge<AppStores>({
      isSupported: false,
      stores: {
        counter: { value: 0 }
      }
    });

    function TestComponent() {
      return (
        <>
          <BridgeContext.Supported>
            <div>Supported</div>
          </BridgeContext.Supported>
          <BridgeContext.Unsupported>
            <div>Unsupported</div>
          </BridgeContext.Unsupported>
        </>
      );
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <TestComponent />
      </BridgeContext.Provider>
    );

    expect(screen.queryByText('Supported')).not.toBeInTheDocument();
    expect(screen.getByText('Unsupported')).toBeInTheDocument();
  });
});
```

### Error Case Testing

Test error handling:

```typescript
describe('Error Handling', () => {
  test('handles store errors gracefully', () => {
    const mockBridge = createMockBridge<AppStores>({
      stores: {
        counter: { value: 0 }
      }
    });

    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <ErrorBoundary fallback={<ErrorComponent />}>
          <CounterContext.Initialized>
            <CounterComponent />
          </CounterContext.Initialized>
        </ErrorBoundary>
      </BridgeContext.Provider>
    );

    // Test error handling
    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('handles bridge connection errors', () => {
    const mockBridge = createMockBridge<AppStores>({
      isSupported: false,
      stores: {
        counter: { value: 0 }
      }
    });

    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <BridgeContext.Unsupported>
          <UnsupportedComponent />
        </BridgeContext.Unsupported>
      </BridgeContext.Provider>
    );

    expect(screen.getByText('Bridge not supported')).toBeInTheDocument();
  });
});
```

## Mock Bridge Usage

### Basic Setup

```typescript
const mockBridge = createMockBridge<AppStores>({
  stores: {
    counter: { value: 0 }
  }
});
```

### Advanced Configuration

```typescript
const mockBridge = createMockBridge<AppStores>({
  isSupported: true,
  stores: {
    counter: { value: 0 }
  }
});
```

## Testing Web Applications

When testing web applications that use the bridge, we use the mock bridge to simulate the native bridge's behavior. This allows us to test web components in isolation.

### Basic Setup

```typescript
// Create a mock bridge that simulates native bridge behavior
const mockBridge = createMockBridge<AppStores>({
  stores: {
    counter: { value: 0 }
  }
});

// Test a web component that uses the bridge
test('Counter component updates state', () => {
  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <CounterContext.Initialized>
        <CounterComponent />
      </CounterContext.Initialized>
    </BridgeContext.Provider>
  );

  // Initial state
  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  // Simulate user interaction
  fireEvent.click(screen.getByText('+'));
  
  // Verify state update
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### Testing Bridge Support

Test how your web app handles unsupported environments:

```typescript
test('App shows fallback when bridge is not supported', () => {
  const mockBridge = createMockBridge<AppStores>({
    isSupported: false,
    stores: {
      counter: { value: 0 }
    }
  });

  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <BridgeContext.Unsupported>
        <FallbackComponent />
      </BridgeContext.Unsupported>
    </BridgeContext.Provider>
  );

  expect(screen.getByText('Bridge not supported')).toBeInTheDocument();
});
```

### Testing Store Initialization

Test how components handle store initialization states:

```typescript
test('Component shows loading state while store initializes', () => {
  const mockBridge = createMockBridge<AppStores>({
    stores: {
      counter: { value: 0 }
    }
  });

  // Start with uninitialized store by resetting to initial state
  mockBridge.reset('counter');

  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <CounterContext.Initializing>
        <LoadingComponent />
      </CounterContext.Initializing>
    </BridgeContext.Provider>
  );

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Simulate store initialization
  mockBridge.dispatch('counter', { type: 'SET', value: 0 });

  // Verify loading state is removed
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```