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
    const webBridge = createWebBridge<AppStores>();
    expect(webBridge.getStore('counter')).toBeUndefined();

    // Native Bridge
    const nativeBridge = createNativeBridge<AppStores>({
      initialState: {
        counter: { value: 0 }
      }
    });
    const counterStore = nativeBridge.getStore('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
  });

  test('handles store initialization states', () => {
    const bridge = createMockBridge<AppStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    // Test uninitialization
    const counterStore = bridge.getStore("counter");
    if (!counterStore) throw new Error("Store not available");
    
    // Make some changes and verify they're tracked
    counterStore.produce(state => {
      state.value = 10;
    });
    expect(counterStore.getSnapshot()).toEqual({ value: 10 });
    
    // Reset to initial state
    bridge.reset('counter');
    expect(counterStore.getSnapshot()).toEqual({ value: 0 });
    expect(bridge.getHistory('counter')).toHaveLength(0);
  });

  test('handles events correctly', () => {
    const bridge = createMockBridge<AppStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const counterStore = bridge.getStore("counter");
    if (!counterStore) throw new Error("Store not available");

    // Dispatch events and check history
    counterStore.dispatch({ type: "INCREMENT" });
    expect(bridge.getHistory("counter")).toEqual([{ type: "INCREMENT" }]);
  });
});
```

### Integration Testing

Test bridge interactions:

```typescript
describe('Bridge Integration', () => {
  test('syncs state between stores', () => {
    const bridge = createMockBridge<AppStores>({
      initialState: {
        counter: { value: 0 },
        user: { name: "Test" }
      }
    });

    const counterStore = bridge.getStore("counter");
    const userStore = bridge.getStore("user");
    if (!counterStore || !userStore) throw new Error("Stores not available");

    // Make changes to stores
    counterStore.produce(state => {
      state.value = 1;
    });
    
    userStore.produce(state => {
      state.name = "New Name";
    });

    // Check that each store was updated independently
    expect(counterStore.getSnapshot()).toEqual({ value: 1 });
    expect(userStore.getSnapshot()).toEqual({ name: "New Name" });
  });
});
```

### Testing Store Lifecycle

```typescript
describe('Store Lifecycle', () => {
  let mockBridge: MockBridge<AppStores>;

  beforeEach(() => {
    // Create mock bridge with initial state
    mockBridge = createMockBridge<AppStores>({
      initialState: {
        counter: { value: 0 },
        user: { name: 'Test' }
      }
    });
  });

  test('handles initialization states correctly', () => {
    // Test initial state
    const counterStore = mockBridge.getStore('counter');
    const userStore = mockBridge.getStore('user');
    
    expect(counterStore).toBeDefined();
    expect(userStore).toBeDefined();
    
    if (!counterStore || !userStore) throw new Error("Stores not available");
    
    expect(counterStore.getSnapshot()).toEqual({ value: 0 });
    expect(userStore.getSnapshot()).toEqual({ name: 'Test' });

    // Creating a new store via setState
    mockBridge.setState('profile', { id: 1, avatar: 'url' });
    const profileStore = mockBridge.getStore('profile');
    expect(profileStore).toBeDefined();
    
    // Reset all stores to initial state
    mockBridge.reset();
    expect(counterStore.getSnapshot()).toEqual({ value: 0 });
    expect(userStore.getSnapshot()).toEqual({ name: 'Test' });
  });

  test('handles component initialization correctly', () => {
    // Component test using mock bridge
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <CounterContext.Provider>
          <CounterComponent />
        </CounterContext.Provider>
      </BridgeContext.Provider>
    );

    // Check initial render
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Get and update the store
    const counterStore = mockBridge.getStore('counter');
    if (!counterStore) throw new Error("Store not available");
    
    counterStore.produce(state => {
      state.value = 5;
    });

    // Verify component updated
    expect(screen.getByText('Count: 5')).toBeInTheDocument();
  });
});
```

### Choosing Between Reset and setState

When testing store lifecycle, you have two main options:

1. Use `reset(storeKey?)` when:
   - You need to restore stores to their initial state from when createMockBridge was called
   - You're cleaning up between tests
   - You want to clear event history
   - If you provide a specific storeKey, only that store is reset. If no key is provided, all stores are reset.

2. Use `setState(storeKey, state)` when:
   - You want to set a store to a specific state regardless of initial state
   - You're creating a new store that wasn't initialized during bridge creation
   - You need to simulate specific state scenarios for testing

### Component Testing

Test React components:

```typescript
describe('Component Integration', () => {
  test('handles store selection correctly', () => {
    const bridge = createMockBridge<AppStores>({
      initialState: {
        counter: { value: 0 },
        user: { name: 'Test', age: 30 }
      }
    });

    function TestComponent() {
      // Using store-specific context
      const counterValue = CounterContext.useSelector(state => state.value);
      const store = CounterContext.useStore();

      return (
        <div>
          <p>Count: {counterValue}</p>
          <button onClick={() => store.dispatch({ type: 'INCREMENT' })}>+</button>
        </div>
      );
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <CounterContext.Provider>
          <TestComponent />
        </CounterContext.Provider>
      </BridgeContext.Provider>
    );

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+'));
    
    // Check event was recorded
    const events = bridge.getHistory('counter');
    expect(events).toEqual([{ type: 'INCREMENT' }]);
  });

  test('handles bridge support states', () => {
    const bridge = createMockBridge<AppStores>({
      isSupported: false,
      initialState: {
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

## Mock Bridge Usage

### Basic Setup

```typescript
const mockBridge = createMockBridge<AppStores>({
  initialState: {
    counter: { value: 0 },
    user: { name: 'Test', age: 30 }
  }
});
```

### Using the getSnapshot Method

To access the current state of a store, always retrieve the store first and then use the `getSnapshot()` method on the store:

```typescript
// Correct pattern: get the store, then use store.getSnapshot()
const counterStore = bridge.getStore('counter');
if (counterStore) {
  const state = counterStore.getSnapshot();
  console.log('Counter value:', state.value);
}
```

### Advanced Configuration

```typescript
const mockBridge = createMockBridge<AppStores>({
  isSupported: true,
  initialState: {
    counter: { value: 0 },
    user: { name: 'Test', age: 30 }
  }
});

// Get specific stores
const counterStore = mockBridge.getStore('counter');
const userStore = mockBridge.getStore('user');

// Work with store methods
if (counterStore) {
  // Listen for changes
  const unsubscribe = counterStore.subscribe(state => {
    console.log('Counter state updated:', state);
  });
  
  // Update state directly with produce
  counterStore.produce(state => {
    state.value += 1;
  });
  
  // Dispatch events (they're recorded but don't change state by default)
  counterStore.dispatch({ type: 'INCREMENT' });
  
  // Check event history
  const events = mockBridge.getHistory('counter');
  console.log('Events:', events);
  
  // Stop listening
  unsubscribe();
}

// Create a new store on the fly
mockBridge.setState('settings', { theme: 'dark', notifications: true });

// Reset a specific store to initial state and clear its events
mockBridge.reset('counter');

// Reset all stores to initial state and clear all events
mockBridge.reset();
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
    initialState: {
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
  // Create a bridge with no initial stores
  const mockBridge = createMockBridge<AppStores>();

  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <CounterContext.Loading>
        <LoadingComponent />
      </CounterContext.Loading>
    </BridgeContext.Provider>
  );

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Initialize the store
  mockBridge.setState('counter', { value: 0 });

  // Verify loading state is removed
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```