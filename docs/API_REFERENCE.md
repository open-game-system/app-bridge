# 📚 API Reference

## Table of Contents

- [Core Types](#core-types)
- [Bridge API](#bridge-api)
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

## Bridge API

### `Bridge<TStores>`

Base interface for web bridge implementations:

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

  /**
   * Reset all stores to their initial state
   * @param storeKey Optional store key to reset only a specific store
   */
  reset: (storeKey?: keyof TStores) => void;
}
```

### `createBridge<TStores>`

Creates a web bridge instance for use in web applications:

```typescript
function createBridge<TStores>(): Bridge<TStores>;

// Example
const bridge = createBridge<AppStores>();
```

### `createNativeBridge<TStores>`

Creates a native bridge instance for use in React Native applications:

```typescript
function createNativeBridge<TStores>(config: {
  stores: {
    [K in keyof TStores]?: {
      initialState: TStores[K]['state'];
      reducers?: {
        [E in TStores[K]['events']['type']]: (
          state: TStores[K]['state'],
          event: Extract<TStores[K]['events'], { type: E }>
        ) => void;
      };
    };
  };
}): NativeBridge<TStores>;

// Example
const bridge = createNativeBridge<AppStores>({
  stores: {
    counter: {
      initialState: { value: 0 },
      reducers: {
        INCREMENT: (state) => {
          state.value += 1;
        }
      }
    }
  }
});
```

## WebView Integration

### `NativeBridge<TStores>`

Interface for native bridge implementations:

```typescript
export interface NativeBridge<TStores extends BridgeStores> {
  /**
   * Get the current snapshot of all stores
   * Returns a map of store keys to their current state
   * If a store is not initialized, its value will be null
   */
  getSnapshot: () => BridgeState<TStores>;

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

  /**
   * Produce a new state for a store using an immer-style recipe
   * @param storeKey The store to update
   * @param recipe Function that receives a draft of the current state
   */
  produce: <K extends keyof TStores>(
    key: K,
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
   * Register a WebView with the bridge
   * This will inject the necessary JavaScript and set up message handlers
   */
  registerWebView: (webView: WebView) => void;

  /**
   * Unregister a WebView from receiving state updates
   * This will clean up message handlers
   */
  unregisterWebView: (webView: WebView) => void;
}
```

### WebView Setup

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

The bridge automatically:
1. Injects the necessary JavaScript into the WebView
2. Sets up message handlers for communication
3. Sends the initial state to the WebView
4. Broadcasts state updates to all registered WebViews
5. Cleans up message handlers when a WebView is unregistered

### Multiple WebViews

The bridge supports multiple WebViews, each receiving the same state updates:

```typescript
function App() {
  const game1Ref = useRef<WebView>(null);
  const game2Ref = useRef<WebView>(null);

  useEffect(() => {
    // Register both WebViews
    bridge.registerWebView(game1Ref.current);
    bridge.registerWebView(game2Ref.current);

    // Cleanup on unmount
    return () => {
      bridge.unregisterWebView(game1Ref.current);
      bridge.unregisterWebView(game2Ref.current);
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={game1Ref}
        source={{ uri: 'https://game1-url.com' }}
      />
      <WebView
        ref={game2Ref}
        source={{ uri: 'https://game2-url.com' }}
      />
    </View>
  );
}
```

## React Integration API

### `createBridgeContext<TStores>`

Creates a namespace object containing the bridge context provider and helper methods:

```typescript
function createBridgeContext<TStores extends BridgeStores>() {
  return {
    Provider: React.ComponentType<BridgeProviderProps<TStores>>;
    useBridge: () => Bridge<TStores>;
    Supported: React.ComponentType<{ children: React.ReactNode }>;
    Unsupported: React.ComponentType<{ children: React.ReactNode }>;
    createStoreContext: <TKey extends keyof TStores>(storeKey: TKey) => StoreContext<TStores[TKey]>;
  }
}

// Example
const BridgeContext = createBridgeContext<AppStores>();
```

### `BridgeContext.Provider`

The top-level provider component:

```typescript
interface BridgeProviderProps<TStores> {
  bridge: Bridge<TStores>;
  children: React.ReactNode;
}

// Example
<BridgeContext.Provider bridge={bridge}>
  <App />
</BridgeContext.Provider>
```

### `createStoreContext`

Creates a store context for a specific feature store:

```typescript
// Example
const CounterContext = BridgeContext.createStoreContext('counter');

function CounterComponent() {
  const value = CounterContext.useSelector(state => state.value);
  const dispatch = CounterContext.useDispatch();

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
    </div>
  );
}
```

The returned store context provides:

```typescript
interface StoreContext<StoreState, StoreEvents> {
  useStore: () => Store<StoreState, StoreEvents> | null;
  useSelector: <T>(selector: (state: StoreState) => T) => T;
  useDispatch: () => (event: StoreEvents) => void;
  Initializing: React.ComponentType<{ children: React.ReactNode }>;
  Initialized: React.ComponentType<{ children: React.ReactNode }>;
}
```

### Bridge Context Selectors

The bridge context provides a top-level `useSelector` hook that can select from any store:

```typescript
function App() {
  // Select from any store using the store key and a selector
  const counterValue = BridgeContext.useSelector('counter', state => state.value);
  const userData = BridgeContext.useSelector('user', state => state.name);

  return (
    <div>
      <p>Counter: {counterValue}</p>
      <p>User: {userData}</p>
    </div>
  );
}
```

The bridge context's `useSelector` hook has the following signature:

```typescript
function useSelector<K extends keyof TStores, T>(
  storeKey: K,
  selector: (state: TStores[K]['state']) => T
): T;
```

This allows you to:
1. Select from any store without creating a store context
2. Access multiple stores in a single component
3. Keep the type safety of the store's state type

### Store Initialization

Stores can be initialized and uninitialized using the native bridge's `setState` method:

```typescript
// Initialize a store
nativeBridge.setState('counter', { value: 0 });

// Uninitialize a store
nativeBridge.setState('counter', null);
```

Components can handle initialization states using the `Initializing` and `Initialized` components:

```typescript
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <CounterContext.Initializing>
        <div>Loading...</div>
      </CounterContext.Initializing>
      <CounterContext.Initialized>
        <Counter />
      </CounterContext.Initialized>
    </BridgeContext.Provider>
  );
}
```

### Bridge Support

The bridge provides components to handle supported and unsupported environments:

```typescript
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <BridgeContext.Supported>
        <Game />
      </BridgeContext.Supported>
      <BridgeContext.Unsupported>
        <Fallback />
      </BridgeContext.Unsupported>
    </BridgeContext.Provider>
  );
}
```

## Testing API

### `createMockBridge<TStores>`

Creates a mock bridge for testing:

```typescript
function createMockBridge<TStores>(config: {
  isSupported?: boolean;
  stores: {
    [K in keyof TStores]?: {
      initialState: TStores[K]['state'];
      reducers?: {
        [E in TStores[K]['events']['type']]: (
          state: TStores[K]['state'],
          event: Extract<TStores[K]['events'], { type: E }>
        ) => void;
      };
    };
  };
}): Bridge<TStores>;

// Example
const mockBridge = createMockBridge<AppStores>({
  stores: {
    counter: {
      initialState: { value: 0 },
      reducers: {
        INCREMENT: (state) => {
          state.value += 1;
        }
      }
    }
  }
});
```