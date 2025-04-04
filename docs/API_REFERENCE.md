# 📚 API Reference

## Table of Contents

- [Core Types](#core-types)
- [Bridge Interfaces](#bridge-interfaces)
- [Bridge Creation](#bridge-creation)
- [WebView Integration](#webview-integration)
- [React Integration API](#react-integration-api)
- [Testing API](#testing-api)

## Core Types

All core types are defined in [`packages/app-bridge/src/types/index.ts`](../packages/app-bridge/src/types/index.ts).

### `State` and `Event`

Base types for all state and events:

```typescript
/**
 * Represents a generic state type that can be used in stores
 */
export type State = object;

/**
 * Represents a generic event type that can be dispatched to stores
 * Events are discriminated unions with a type field and optional additional properties
 */
export type Event = {
  type: string;
};
```

### `BridgeStores`

Type for defining your application's stores:

```typescript
/**
 * Represents a collection of store definitions
 */
export type BridgeStores = Record<string, { state: State; events: Event }>;

// Example using shared types
export type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};
```

### `BridgeState`

Type representing the current state of all stores:

```typescript
/**
 * Represents the current state of all stores in a bridge
 */
export type BridgeState<TStores extends BridgeStores> = {
  [K in keyof TStores]: TStores[K]['state'] | null;
};

// Example
const state: BridgeState<AppStores> = {
  counter: { value: 42 },  // Initialized store
  user: null               // Uninitialized store
};
```

## Bridge Interfaces

### Base Bridge Interface

All bridges implement this base interface:

```typescript
export interface Bridge<TStores extends BridgeStores> {
  /**
   * Check if the bridge is supported in the current environment
   */
  isSupported(): boolean;

  /**
   * Get the current snapshot of all stores
   * Returns a map of store keys to their current state
   * If a store is not initialized, its value will be null
   */
  getSnapshot(): BridgeState<TStores>;

  /**
   * Subscribe to changes in a specific store's state
   * @param storeKey The store to subscribe to
   * @param callback The callback to be called when the store's state changes
   */
  subscribe: <K extends keyof TStores>(
    storeKey: K,
    callback: (state: TStores[K]['state']) => void
  ) => () => void;

  /**
   * Dispatch an event to a specific store
   * @param storeKey The store to dispatch to
   * @param event The event to dispatch
   */
  dispatch: <K extends keyof TStores>(storeKey: K, event: TStores[K]['events']) => void;
}
```

### Native Bridge Interface

The native bridge extends the base bridge with additional methods for WebView management and state manipulation:

```typescript
export interface NativeBridge<TStores extends BridgeStores> extends Bridge<TStores> {
  /**
   * Register a WebView to receive state updates
   * Sets up message handling and injects necessary JavaScript
   */
  registerWebView: (webView: WebView) => void;

  /**
   * Unregister a WebView from receiving state updates
   * Cleans up message handlers
   */
  unregisterWebView: (webView: WebView) => void;

  /**
   * Produce a new state for a store using an immer-style recipe
   * @param storeKey The store to update
   * @param recipe Function that receives a draft of the current state
   */
  produce: <K extends keyof TStores>(
    storeKey: K,
    recipe: (draft: TStores[K]['state']) => void
  ) => void;

  /**
   * Set the state of a store directly
   * @param key The store to update
   * @param state The new state value (can be null to uninitialize)
   */
  setState: <K extends keyof TStores>(
    key: K,
    state: TStores[K]['state'] | null
  ) => void;

  /**
   * Reset a store to its initial state
   * @param storeKey Optional store key to reset only a specific store
   */
  reset: (storeKey?: keyof TStores) => void;
}
```

### Mock Bridge Interface

The mock bridge extends the base bridge with testing-specific functionality:

```typescript
export interface MockBridge<TStores extends BridgeStores>
  extends Bridge<TStores> {
  /**
   * Get a store by its key.
   * Returns undefined if the store doesn't exist
   */
  getStore: <K extends keyof TStores>(
    storeKey: K
  ) => MockStore<TStores[K]["state"], TStores[K]["events"]> | undefined;

  /**
   * Get all events that have been dispatched to a store
   */
  getHistory: <K extends keyof TStores>(storeKey: K) => TStores[K]["events"][];

  /**
   * Reset a store's state and clear its event history
   * If no storeKey is provided, resets all stores
   */
  reset: (storeKey?: keyof TStores) => void;

  /**
   * Set the state of a store
   * Creates the store if it doesn't exist or updates its state if it does
   */
  setState: <K extends keyof TStores>(
    storeKey: K,
    state: TStores[K]["state"]
  ) => void;
}
```

## Bridge Creation

### `createWebBridge<TStores>`

Creates a web bridge instance for use in web applications:

```typescript
function createWebBridge<TStores extends BridgeStores>(): Bridge<TStores>

// Example
const bridge = createWebBridge<AppStores>();
```

The web bridge automatically receives its state from the native side through WebView messages.

### `createNativeBridge<TStores>`

Creates a native bridge instance for use in React Native applications:

```typescript
function createNativeBridge<TStores extends BridgeStores>(
  config: {
    initialState?: { [K in keyof TStores]: TStores[K]['state'] | null };
  } = {}
): NativeBridge<TStores>

// Example
const bridge = createNativeBridge<AppStores>({
  initialState: {
    counter: { value: 0 }
  }
});
```

### `createMockBridge<TStores>`

Creates a mock bridge instance for testing:

```typescript
function createMockBridge<TStores extends BridgeStores>(
  config?: {
    /**
     * Whether the bridge is supported in the current environment
     * @default true
     */
    isSupported?: boolean;

    /**
     * Initial state for stores in the bridge
     * When provided, stores will be pre-initialized with these values
     */
    initialState?: Record<keyof TStores, TStores[keyof TStores]["state"]>;
  }
): MockBridge<TStores>

// Example
const bridge = createMockBridge<AppStores>({
  isSupported: true,
  initialState: {
    counter: { value: 0 },
    user: { name: "John", age: 30 }
  }
});
```

## WebView Integration

### WebView Setup

The WebView integration is a crucial part of the bridge, enabling bidirectional communication between the native app and the web content. Here's how it works:

```typescript
// In React Native app
function GameWebView() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    // Register the WebView with the bridge
    bridge.registerWebView(webViewRef.current);
    
    // Cleanup on unmount
    return () => {
      bridge.unregisterWebView(webViewRef.current);
    };
  }, []);

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://your-game-url.com' }}
    />
  );
}
```

#### Communication Flow

1. **Native to Web Communication**:
   - When the native state changes, the bridge uses `injectJavaScript` to send state updates to the WebView
   - The injected JavaScript dispatches a `MessageEvent` with the state update
   - The web bridge listens for these events and updates its local state

2. **Web to Native Communication**:
   - When the web side dispatches an event, it uses `postMessage` to send the event to the native side
   - The WebView's `onMessage` handler receives the event and passes it to the bridge
   - The bridge processes the event and updates the native state

#### Message Format

The messages exchanged between the native and web sides follow a specific format:

1. **State Updates (Native to Web)**:
   ```json
   {
     "type": "STATE_UPDATE",
     "storeKey": "counter",
     "operations": [
       { "op": "replace", "path": "/value", "value": 42 }
     ]
   }
   ```

2. **Events (Web to Native)**:
   ```json
   {
     "type": "EVENT",
     "storeKey": "counter",
     "event": { "type": "INCREMENT" }
   }
   ```

The bridge automatically handles the serialization and deserialization of these messages, so you don't need to worry about the details.

## React Integration API

### `createBridgeContext<TStores>`

Creates a namespace object containing the bridge context provider and helper components. You must always provide your store types as a type parameter:

```typescript
import { createBridgeContext } from '@open-game-system/app-bridge';
import type { AppStores } from './shared/types';

// Always create a context with your specific store types
const BridgeContext = createBridgeContext<AppStores>();
```

The returned object includes:

```typescript
{
  Provider: React.ComponentType<{ bridge: Bridge<TStores>; children: ReactNode }>;
  Supported: React.ComponentType<{ children: ReactNode }>;
  Unsupported: React.ComponentType<{ children: ReactNode }>;
  createStoreContext: <K extends keyof TStores>(storeKey: K) => StoreContext<TStores, K>;
}
```

### `BridgeContext.Provider`

The top-level provider component that makes the bridge available to all children:

```typescript
import { createWebBridge, createBridgeContext } from '@open-game-system/app-bridge';
import type { AppStores } from './shared/types';

const bridge = createWebBridge<AppStores>();
const BridgeContext = createBridgeContext<AppStores>();

// Example
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      {/* App content */}
    </BridgeContext.Provider>
  );
}
```

### `BridgeContext.Supported` and `BridgeContext.Unsupported`

Conditional render components that only render their children when the bridge is or isn't supported:

```typescript
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <BridgeContext.Supported>
        <p>Bridge is supported in this environment!</p>
        <GameComponent />
      </BridgeContext.Supported>
      <BridgeContext.Unsupported>
        <p>Bridge is not supported here. Please use the native app.</p>
      </BridgeContext.Unsupported>
    </BridgeContext.Provider>
  );
}
```

### `createStoreContext<K>`

Creates a store context for a specific store key:

```typescript
const CounterContext = BridgeContext.createStoreContext('counter');
const UserContext = BridgeContext.createStoreContext('user');
```

The returned object includes:

```typescript
{
  Provider: React.ComponentType<{ children: ReactNode }>;
  Loading: React.ComponentType<{ children: ReactNode }>;
  useStore: () => Store<TStores[K]["state"], TStores[K]["events"]>;
  useSelector: <T>(selector: (state: TStores[K]["state"]) => T) => T;
}
```

### Store Context Components

#### `StoreContext.Provider`

Component that makes a specific store available to its children. This component only renders when the store is available (initialized):

```typescript
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <CounterContext.Provider>
        {/* Only rendered when counter store is initialized */}
        <CounterComponent />
      </CounterContext.Provider>
    </BridgeContext.Provider>
  );
}
```

#### `StoreContext.Loading`

Component that renders its children only when the bridge is supported but the store is not yet available:

```typescript
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <CounterContext.Provider>
        <CounterDisplay />
      </CounterContext.Provider>
      <CounterContext.Loading>
        <LoadingSpinner />
      </CounterContext.Loading>
    </BridgeContext.Provider>
  );
}
```

### Store Hooks

#### `useStore()`

Hook to get the store instance for a specific store. Must be used within a `StoreContext.Provider`:

```typescript
function Counter() {
  const store = CounterContext.useStore();
  
  // Now you can directly interact with the store
  const state = store.getSnapshot();
  
  return (
    <button onClick={() => store.dispatch({ type: 'INCREMENT' })}>
      Count: {state.value}
    </button>
  );
}
```

This hook will throw an error if used outside of a `StoreContext.Provider`.

#### `useSelector(selector)`

Hook to select and subscribe to a specific piece of data from the store:

```typescript
function Counter() {
  // Will throw if not used inside CounterContext.Provider
  const count = CounterContext.useSelector(state => state.value);
  const store = CounterContext.useStore();
  
  return (
    <button onClick={() => store.dispatch({ type: 'INCREMENT' })}>
      Count: {count}
    </button>
  );
}
```

## Complete Example

```tsx
// shared/types.ts
import { BridgeStoreDefinitions, State } from '@open-game-system/app-bridge';

export interface CounterState extends State {
  value: number;
}

export type CounterEvent = 
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; value: number };

export interface AppStores extends BridgeStoreDefinitions {
  counter: {
    state: CounterState;
    events: CounterEvent;
  };
}

// App.tsx
import { createBridgeContext, createWebBridge } from '@open-game-system/app-bridge';
import type { AppStores } from './shared/types';

// Create the bridge
const bridge = createWebBridge<AppStores>();

// Create contexts
const BridgeContext = createBridgeContext<AppStores>();
const CounterContext = BridgeContext.createStoreContext('counter');

function Counter() {
  // Only available inside CounterContext.Provider
  const count = CounterContext.useSelector(state => state.value);
  const store = CounterContext.useStore();
  
  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => store.dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => store.dispatch({ type: 'DECREMENT' })}>-</button>
    </div>
  );
}

function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <BridgeContext.Supported>
        {/* Counter store integration */}
        <CounterContext.Provider>
          <Counter />
        </CounterContext.Provider>
        <CounterContext.Loading>
          <p>Waiting for counter data...</p>
        </CounterContext.Loading>
      </BridgeContext.Supported>
      <BridgeContext.Unsupported>
        <p>This app must be run inside the native app.</p>
      </BridgeContext.Unsupported>
    </BridgeContext.Provider>
  );
}
```

## Testing with React

When testing React components that use the bridge, you should create test-specific contexts using the mock bridge:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockBridge, createBridgeContext } from '@open-game-system/app-bridge';
import type { AppStores } from './shared/types';

// Test-specific bridge
const mockBridge = createMockBridge<AppStores>({
  initialState: {
    counter: { value: 0 }
  }
});

// Test-specific contexts
const TestBridgeContext = createBridgeContext<AppStores>();
const TestCounterContext = TestBridgeContext.createStoreContext('counter');

test('Counter increments when clicked', () => {
  render(
    <TestBridgeContext.Provider bridge={mockBridge}>
      <TestCounterContext.Provider>
        <Counter />
      </TestCounterContext.Provider>
    </TestBridgeContext.Provider>
  );
  
  // Initial state
  expect(screen.getByText('Counter: 0')).toBeInTheDocument();
  
  // Click the increment button
  fireEvent.click(screen.getByText('+'));
  
  // Check that the event was dispatched
  const counterStore = mockBridge.getStore('counter');
  expect(mockBridge.getHistory('counter')).toEqual([{ type: 'INCREMENT' }]);
  
  // Update the state to simulate what would happen in the real app
  if (counterStore) {
    counterStore.produce(state => {
      state.value = 1;
    });
  }
  
  // Check that the UI updated
  expect(screen.getByText('Counter: 1')).toBeInTheDocument();
});
```

## Testing API

### Mock Bridge Features

The mock bridge provides several testing-specific features:

1. **Automatic Event Handling**:
   - Automatically handles common event types (INCREMENT, DECREMENT, SET)
   - Simulates state updates based on dispatched events

2. **State Management**:
   - Maintains initial state for reset functionality
   - Supports testing state updates and subscriptions

3. **Support Testing**:
   - Allows testing bridge support states through `isSupported` configuration
   - Simulates WebView communication for testing

4. **Reset Functionality**:
   - Supports resetting individual stores or all stores
   - Maintains initial state for accurate testing

Example usage:

```typescript
describe('Counter Component', () => {
  const mockBridge = createMockBridge<AppStores>({
    isSupported: true,
    initialState: {
      counter: { value: 0 }
    }
  });

  it('handles state updates', () => {
    // Get the store
    const counterStore = mockBridge.getStore('counter');
    if (!counterStore) throw new Error("Store not available");
    
    // Test initial state
    expect(counterStore.getSnapshot()).toEqual({ value: 0 });

    // Dispatch events and check they're recorded
    counterStore.dispatch({ type: 'INCREMENT' });
    expect(mockBridge.getHistory('counter')).toEqual([{ type: 'INCREMENT' }]);
    
    // Update state directly
    counterStore.produce(state => {
      state.value = 1;
    });
    expect(counterStore.getSnapshot()).toEqual({ value: 1 });

    // Test reset
    mockBridge.reset('counter');
    expect(counterStore.getSnapshot()).toEqual({ value: 0 });
    expect(mockBridge.getHistory('counter')).toHaveLength(0);
  });

  it('handles subscriptions', () => {
    const counterStore = mockBridge.getStore('counter');
    if (!counterStore) throw new Error("Store not available");
    
    const listener = vi.fn();
    const unsubscribe = counterStore.subscribe(listener);

    // Initial state notification
    expect(listener).toHaveBeenCalledWith({ value: 0 });

    // State update via produce
    counterStore.produce(state => {
      state.value = 1;
    });
    expect(listener).toHaveBeenCalledWith({ value: 1 });

    // Unsubscribe
    unsubscribe();
    counterStore.produce(state => {
      state.value = 2;
    });
    expect(listener).toHaveBeenCalledTimes(2); // Initial + first produce
  });
});
```