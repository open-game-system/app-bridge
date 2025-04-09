# @open-game-system/app-bridge-types

Core type definitions for the app-bridge ecosystem.

## Installation

```bash
npm install @open-game-system/app-bridge-types
# or
yarn add @open-game-system/app-bridge-types
# or
pnpm add @open-game-system/app-bridge-types
```

## API Reference

### Core Types

```typescript
/**
 * Represents a generic state type that can be used in stores
 */
export type State = object;

/**
 * Represents a generic event type that can be dispatched to stores
 * Events are discriminated unions with a type field and optional additional properties
 */
export type Event = { type: string };

/**
 * Producer function type for handling events
 * Similar to Immer's produce function
 */
export type Producer<S extends State, E extends Event> = (draft: S, event: E) => void;

/**
 * Store configuration for creating new stores
 */
export interface StoreConfig<S extends State, E extends Event> {
  initialState: S;
  producer?: Producer<S, E>;
}

/**
 * Creates a new store with the given configuration
 */
export type CreateStore = <S extends State, E extends Event>(
  config: StoreConfig<S, E>
) => Store<S, E>;

/**
 * Represents a store instance with state management capabilities
 */
export interface Store<S extends State = State, E extends Event = Event> {
  /** Get the current state */
  getSnapshot(): S;
  /** Subscribe to state changes */
  subscribe(listener: (state: S) => void): () => void;
  /** Dispatch an event to update the state */
  dispatch(event: E): void;
  /** Reset store to initial state */
  reset(): void;
}

/**
 * Represents a collection of store definitions
 */
export type BridgeStores<
  T extends Record<string, { state: State; events: Event }> = Record<
    string,
    { state: State; events: Event }
  >
> = {
  [K in keyof T]: {
    state: T[K]["state"];
    events: T[K]["events"];
  };
};

/**
 * Base bridge interface that all implementations extend
 */
export interface Bridge<TStores extends BridgeStores> {
  /**
   * Check if the bridge is supported in the current environment
   */
  isSupported: () => boolean;

  /**
   * Get a store by its key
   * Returns undefined if the store doesn't exist
   */
  getStore: <K extends keyof TStores>(
    storeKey: K
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
   */
  subscribe: (listener: () => void) => () => void;
}

/**
 * Utility type to extract store types from any Bridge implementation
 */
export type ExtractStoresType<T> = T extends {
  getStore: <K extends keyof (infer U)>(key: K) => any;
}
  ? U
  : never;
```

## Usage Examples

### Creating a Store Type

```typescript
// Define your state type
interface CounterState extends State {
  value: number;
}

// Define your events
type CounterEvents =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };

// Create store configuration
const config: StoreConfig<CounterState, CounterEvents> = {
  initialState: { value: 0 },
  producer: (draft, event) => {
    switch (event.type) {
      case "INCREMENT":
        draft.value += 1;
        break;
      case "DECREMENT":
        draft.value -= 1;
        break;
      case "SET":
        draft.value = event.value;
        break;
    }
  }
};
```

### Defining Bridge Stores

```typescript
// Define your application's stores
type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
  // Add more stores as needed
};

// Use with a bridge implementation
const bridge: Bridge<AppStores> = createBridge();
```

### Using Store Methods

```typescript
// Get a store
const store = bridge.getStore('counter');
if (store) {
  // Subscribe to state changes
  const unsubscribe = store.subscribe(state => {
    console.log('Counter value:', state.value);
  });

  // Dispatch events
  store.dispatch({ type: "INCREMENT" });
  store.dispatch({ type: "SET", value: 42 });

  // Reset to initial state
  store.reset();

  // Clean up subscription
  unsubscribe();
}
```

## Error Handling

The types include built-in error handling patterns:

1. **Store Availability**
```typescript
const store = bridge.getStore('counter');
if (!store) {
  // Handle missing store case
  throw new Error('Counter store not available');
}
```

2. **Type Safety**
```typescript
// TypeScript will error if you try to:
// - Dispatch invalid events
// - Access non-existent stores
// - Use incorrect state types
```
