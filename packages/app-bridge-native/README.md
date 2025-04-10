# @open-game-system/app-bridge-native

React Native specific implementation of the app-bridge ecosystem.

## Installation

```bash
npm install @open-game-system/app-bridge-native
```

## API Reference

### createNativeBridge

```typescript
/**
 * Creates a native bridge instance for use in React Native applications
 * @template TStores Store definitions for the bridge
 * @returns A NativeBridge instance
 */
function createNativeBridge<TStores extends BridgeStores>(): NativeBridge<TStores>;
```

### createStore

```typescript
/**
 * Creates a new store with the given configuration
 */
function createStore<S extends State, E extends Event>(config: StoreConfig<S, E>): Store<S, E>;
```

### NativeBridge Interface

```typescript
interface NativeBridge<TStores extends BridgeStores> {
  /**
   * Get a store by its key
   * Returns undefined if the store doesn't exist
   */
  getStore: <K extends keyof TStores>(
    key: K
  ) => Store<TStores[K]["state"], TStores[K]["events"]> | undefined;

  /**
   * Set or remove a store for a given key
   */
  setStore: <K extends keyof TStores>(
    key: K,
    store: Store<TStores[K]["state"], TStores[K]["events"]> | undefined
  ) => void;

  /**
   * Subscribe to store availability changes
   * Returns an unsubscribe function
   */
  subscribe: (listener: () => void) => () => void;

  /**
   * Process a message received from the WebView
   */
  handleWebMessage: (message: string | { nativeEvent: { data: string } }) => void;

  /**
   * Register a WebView to receive state updates
   * Returns an unsubscribe function
   */
  registerWebView: (webView: WebView | null | undefined) => () => void;

  /**
   * Unregister a WebView from receiving state updates
   */
  unregisterWebView: (webView: WebView | null | undefined) => void;

  /**
   * Subscribe to ready state changes for a specific WebView
   * Returns an unsubscribe function
   */
  subscribeToReadyState: (
    webView: WebView | null | undefined,
    callback: (isReady: boolean) => void
  ) => () => void;

  /**
   * Get the current ready state for a specific WebView
   */
  getReadyState: (webView: WebView | null | undefined) => boolean;
}
```

### Store Interface

```typescript
interface Store<S extends State, E extends Event> {
  /**
   * Get the current state
   */
  getSnapshot: () => S;

  /**
   * Subscribe to state changes
   * Returns an unsubscribe function
   */
  subscribe: (callback: (state: S) => void) => () => void;

  /**
   * Dispatch an event to the store
   */
  dispatch: (event: E) => void;

  /**
   * Reset store to its initial state
   */
  reset: () => void;
}
```

## Usage Examples

### Example 1: Store with Initial State

In this example, we create a store with a known initial state and register it immediately:

```typescript
import { createNativeBridge, createStore } from '@open-game-system/app-bridge-native';
import type { AppStores } from './types';

function MyComponent() {
  const webViewRef = useRef<WebView>(null);
  const bridge = useMemo(() => createNativeBridge<AppStores>(), []);

  // Create and register a store with initial state
  useEffect(() => {
    const store = createStore({
      initialState: { value: 0 },
      producer: (draft, event) => {
        switch (event.type) {
          case "INCREMENT":
            draft.value += 1;
            break;
          case "DECREMENT":
            draft.value -= 1;
            break;
        }
      }
    });

    bridge.setStore('counter', store);
    return () => bridge.setStore('counter', undefined);
  }, [bridge]);

  // Register WebView
  useEffect(() => {
    const unregister = bridge.registerWebView(webViewRef.current);
    return () => unregister();
  }, []);

  return (
    <WebView 
      ref={webViewRef}
      onMessage={event => bridge.handleWebMessage(event)}
    />
  );
}
```

### Example 2: Complete React Context Integration

Here's a complete example showing how to:
1. Set up the bridge in context
2. Create and manage stores
3. Handle WebView communication
4. Subscribe to store changes and ready state

```typescript
// types.ts
import type { BridgeStores, State } from '@open-game-system/app-bridge-types';

interface CounterState extends State {
  value: number;
}

export interface AppStores extends BridgeStores {
  counter: {
    state: CounterState;
    events: { type: 'INCREMENT' } | { type: 'DECREMENT' };
  };
}

// BridgeContext.tsx
import React, { createContext, useContext, useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { createNativeBridge, createStore } from '@open-game-system/app-bridge-native';
import type { AppStores } from './types';

const BridgeContext = createContext<ReturnType<typeof createNativeBridge<AppStores>> | null>(null);

export function BridgeProvider({ children }: { children: React.ReactNode }) {
  const webViewRef = useRef<WebView>(null);
  const bridge = useMemo(() => createNativeBridge<AppStores>(), []);

  useEffect(() => {
    // Create and register the counter store
    const store = createStore({
      initialState: { value: 0 },
      producer: (draft, event) => {
        switch (event.type) {
          case "INCREMENT":
            draft.value += 1;
            break;
          case "DECREMENT":
            draft.value -= 1;
            break;
        }
      }
    });

    bridge.setStore('counter', store);
    return () => bridge.setStore('counter', undefined);
  }, [bridge]);

  useEffect(() => {
    const unregister = bridge.registerWebView(webViewRef.current);
    const unsubscribeReady = bridge.subscribeToReadyState(webViewRef.current, (isReady) => {
      if (isReady) {
        console.log('Bridge is ready for communication!');
      }
    });

    return () => {
      unregister();
      unsubscribeReady();
    };
  }, []);

  return (
    <BridgeContext.Provider value={bridge}>
      <WebView
        ref={webViewRef}
        onMessage={event => bridge.handleWebMessage(event)}
        // ... other WebView props
      />
      {children}
    </BridgeContext.Provider>
  );
}

export function useBridge() {
  const bridge = useContext(BridgeContext);
  if (!bridge) throw new Error('useBridge must be used within BridgeProvider');
  return bridge;
}

// Counter.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useBridge } from './BridgeContext';

export function Counter() {
  const bridge = useBridge();
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const store = bridge.getStore('counter');
    if (!store) return;

    // Initialize with current value
    setCount(store.getSnapshot().value);

    // Subscribe to changes
    return store.subscribe((state) => {
      setCount(state.value);
    });
  }, []);

  const handleIncrement = () => {
    const store = bridge.getStore('counter');
    if (!store) return;
    store.dispatch({ type: 'INCREMENT' });
  };

  const handleDecrement = () => {
    const store = bridge.getStore('counter');
    if (!store) return;
    store.dispatch({ type: 'DECREMENT' });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Button title="-" onPress={handleDecrement} />
      <Text style={{ marginHorizontal: 20 }}>{count}</Text>
      <Button title="+" onPress={handleIncrement} />
    </View>
  );
}
```

## Important: WebView Message Handling

The bridge requires proper message handling to function:

1. **Connect WebView Messages**: You MUST connect the WebView's `onMessage` event to the bridge:
```typescript
<WebView 
  onMessage={event => bridge.handleWebMessage(event)}
/>
```

Without this connection:
- The bridge won't receive events or the ready signal from the web bridge
- The `subscribeToReadyState` callback won't fire with `true`
- State updates won't be sent to or received from the WebView

Note: The web bridge automatically sends the ready signal and handles internal initialization messages when `registerWebView` and `handleWebMessage` are correctly set up. You do not need to handle `STATE_INIT` or manually signal readiness. 