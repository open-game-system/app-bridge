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

- **`config.producer`**: An optional function `(draft: S, event: E) => void` (compatible with Immer) that modifies the state based on dispatched events.
- **`config.on`**: An optional object where keys are event types (`E['type']`) and values are listener functions `(event: E, store: Store<S, E>) => Promise<void> | void`. These listeners are executed *after* the producer updates the state for a given dispatched event. They can be async and have access to the store instance (e.g., to dispatch further events or read the latest state).

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
   * Dispatch an event to the store. Returns a Promise that resolves when configured
   * and dynamic 'on' listeners for this event type have completed.
   */
  dispatch: (event: E) => Promise<void>;

  /**
   * Reset store to its initial state
   */
  reset: () => void;

  /**
   * Dynamically add a listener for a specific dispatched event type.
   * Listeners can be async and receive the event object and the store instance.
   * Returns an unsubscribe function.
   */
  on: <EventType extends E['type']>(
    eventType: EventType,
    listener: (event: Extract<E, { type: EventType }>, store: Store<S, E>) => Promise<void> | void
  ) => () => void;
}
```

## Usage Examples

### Example 1: Store with `on` Config for Side Effects

```typescript
import { createNativeBridge, createStore } from '@open-game-system/app-bridge-native';
import type { AppStores, CounterState, CounterEvents } from './types'; // Assuming types are defined

function MyComponent() {
  const webViewRef = useRef<WebView>(null);
  const bridge = useMemo(() => createNativeBridge<AppStores>(), []);

  // Create and register a store with initial state and declarative listeners
  useEffect(() => {
    const store = createStore<CounterState, CounterEvents>({
      initialState: { value: 0 },
      producer: (draft, event) => {
        switch (event.type) {
          case "INCREMENT":
            draft.value += 1;
            break;
          case "DECREMENT":
            if (draft.value > 0) draft.value -= 1;
            break;
        }
      },
      // Declarative listeners in config
      on: {
          INCREMENT: async (event, store) => {
              console.log(`[Config] Incremented! New value: ${store.getSnapshot().value}`);
              // Example: Dispatch another event after a delay
              await new Promise(r => setTimeout(r, 500));
              store.dispatch({ type: "LOG_UPDATE", value: store.getSnapshot().value }); // Assuming LOG_UPDATE exists
          },
          DECREMENT: (event, store) => {
              console.log(`[Config] Decremented! New value: ${store.getSnapshot().value}`);
          }
      }
    });

    bridge.setStore('counter', store);

    // Example: Adding a dynamic listener
    const unsubscribeLog = store.on('LOG_UPDATE', (event) => {
        console.log('[Dynamic] Logged update:', event.value);
    });

    return () => {
        bridge.setStore('counter', undefined);
        unsubscribeLog(); // Clean up dynamic listener
    };
  }, [bridge]);

  // Register WebView
  useEffect(() => {
    const unregister = bridge.registerWebView(webViewRef.current);
    return () => unregister();
  }, []);

  return (
    <WebView 
      ref={webViewRef}
      onMessage={event => bridge.handleWebMessage(event.nativeEvent.data)}
    />
  );
}
```

### Example 2: Complete React Context Integration (Conceptual)

*(The structure remains largely the same as the previous example in the README, but highlights where the new `on` config and `store.on` method would fit)*

```typescript
// types.ts - (Assume types defined as before)
import type { BridgeStores, State, Event } from '@open-game-system/app-bridge-types';

interface CounterState extends State { /* ... */ }
interface LogState extends State { messages: string[] };
type CounterEvents = { type: 'INCREMENT' } | { type: 'DECREMENT' };
type LogEvents = { type: 'LOG'; message: string };

export interface AppStores extends BridgeStores {
  counter: { state: CounterState; events: CounterEvents };
  logger: { state: LogState; events: LogEvents };
}

// BridgeContext.tsx
import React, { /* ... */ } from 'react';
import { /* ... */ } from 'react-native';
import { createNativeBridge, createStore } from '@open-game-system/app-bridge-native';
import type { AppStores, CounterState, CounterEvents, LogState, LogEvents } from './types';

const BridgeContext = createContext<ReturnType<typeof createNativeBridge<AppStores>> | null>(null);

export function BridgeProvider({ children }: { children: React.ReactNode }) {
  const webViewRef = useRef<WebView>(null);
  const bridge = useMemo(() => createNativeBridge<AppStores>(), []);

  useEffect(() => {
    // Create logger store
    const loggerStore = createStore<LogState, LogEvents>({
        initialState: { messages: [] },
        producer: (draft, event) => {
            if (event.type === 'LOG') {
                draft.messages.push(event.message);
            }
        }
    });

    // Create counter store with 'on' config to dispatch to logger
    const counterStore = createStore<CounterState, CounterEvents>({
      initialState: { value: 0 },
      producer: (draft, event) => { /* ... increment/decrement logic ... */ },
      on: {
          INCREMENT: (event, store) => {
              // Dispatch to another store from listener
              loggerStore.dispatch({ type: 'LOG', message: `Incremented to ${store.getSnapshot().value}` });
          },
          DECREMENT: (event, store) => {
              loggerStore.dispatch({ type: 'LOG', message: `Decremented to ${store.getSnapshot().value}` });
          }
      }
    });

    bridge.setStore('counter', counterStore);
    bridge.setStore('logger', loggerStore);

    return () => {
        bridge.setStore('counter', undefined);
        bridge.setStore('logger', undefined);
    }
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

// Counter.tsx / Logger.tsx (Components would use useBridge and store methods as before)
// ... Example component implementations ...
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