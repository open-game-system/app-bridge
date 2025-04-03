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
  initialState?: { [K in keyof TStores]: TStores[K]['state'] | null };
}): NativeBridge<TStores>;

// Example
const bridge = createNativeBridge<AppStores>({
  initialState: {
    counter: { value: 0 }
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
   * This sets up bidirectional communication between the native app and the WebView:
   * 1. Injects the necessary JavaScript into the WebView to handle state updates
   * 2. Sets up the WebView's onMessage handler to receive events from the web side
   * 3. Sends the initial state to the WebView
   * 4. Ensures the WebView receives state updates when the native state changes
   * 
   * @param webView The WebView instance to register
   */
  registerWebView: (webView: WebView) => void;

  /**
   * Unregister a WebView from receiving state updates
   * This cleans up the message handlers and stops sending state updates to the WebView
   * 
   * @param webView The WebView instance to unregister
   */
  unregisterWebView: (webView: WebView) => void;
}
```

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

Creates a mock bridge instance for testing. The mock bridge extends the `Bridge` interface with additional testing-specific methods:

```typescript
interface MockBridge<TStores extends BridgeStores> extends Bridge<TStores> {
  /**
   * Reset the mock bridge's state to its initial values from when createMockBridge was called
   * @param storeKey Optional store key to reset only a specific store
   * 
   * Note: This method is specific to the mock bridge and is not available on the native bridge.
   * When called, it will:
   * 1. Reset the specified store(s) to their initial state from config.stores
   * 2. If a store wasn't initialized with an initial state, its state remains unchanged
   * 3. Always clears the dispatch history
   */
  reset: (storeKey?: keyof TStores) => void;
}

function createMockBridge<TStores>(config: {
  isSupported?: boolean;
  stores?: { [K in keyof TStores]: TStores[K]['state'] };
  reducers?: {
    [K in keyof TStores]?: (
      state: TStores[K]['state'],
      event: TStores[K]['events']
    ) => TStores[K]['state'];
  };
}): MockBridge<TStores>;

// Example
const bridge = createMockBridge<AppStores>({
  stores: {
    counter: { value: 0 }
  }
});
```

The mock bridge is useful for testing web components that use the bridge, as it provides a way to:
1. Initialize state for testing
2. Reset state between tests to the initial state from when createMockBridge was called
3. Verify event dispatches
4. Test state updates