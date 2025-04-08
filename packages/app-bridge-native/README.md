# @open-game-system/app-bridge-native

React Native specific implementation of the app-bridge ecosystem.

## Installation

```bash
npm install @open-game-system/app-bridge-native
# or
yarn add @open-game-system/app-bridge-native
# or
pnpm add @open-game-system/app-bridge-native
```

## API Reference

### createNativeBridge

```typescript
/**
 * Creates a native bridge instance for use in React Native applications
 * @template TStores Store definitions for the bridge
 * @param config Optional configuration for the native bridge
 * @returns A NativeBridge instance
 */
export function createNativeBridge<TStores extends BridgeStores>(
  config?: {
    initialState?: { [K in keyof TStores]?: TStores[K]["state"] };
    producers?: {
      [K in keyof TStores]?: (
        draft: TStores[K]["state"], 
        event: TStores[K]["events"]
      ) => void 
    };
  }
): NativeBridge<TStores>;
```

### NativeBridge Interface

```typescript
/**
 * Represents the native bridge interface
 */
export interface NativeBridge<TStores extends BridgeStores> {
  /**
   * Check if the bridge is supported in the current environment
   * Always returns true for native bridge
   */
  isSupported: () => boolean;

  /**
   * Get a store by its key
   * Returns undefined if the store doesn't exist
   */
  getStore: <K extends keyof TStores>(
    storeKey: K
  ) => NativeStore<TStores[K]["state"], TStores[K]["events"]> | undefined;

  /**
   * Subscribe to store availability changes
   * Returns an unsubscribe function
   */
  subscribe: (listener: () => void) => () => void;

  /**
   * Dispatch an event to a store
   */
  dispatch: <K extends keyof TStores>(
    storeKey: K,
    event: TStores[K]["events"]
  ) => void;

  /**
   * Produce a new state for a store using Immer
   */
  produce: <K extends keyof TStores>(
    storeKey: K,
    producer: (draft: TStores[K]["state"]) => void
  ) => void;

  /**
   * Set the state for a store directly
   */
  setState: <K extends keyof TStores>(
    key: K,
    newState: TStores[K]["state"] | undefined
  ) => void;
}
```

### NativeStore Interface

```typescript
/**
 * Represents a store in the native bridge
 */
export interface NativeStore<TState, TEvents> {
  /**
   * Get the current state of the store
   */
  getSnapshot: () => TState;

  /**
   * Subscribe to state changes
   * Returns an unsubscribe function
   */
  subscribe: (callback: (state: TState) => void) => () => void;

  /**
   * Produce a new state using Immer
   */
  produce: (producer: (draft: TState) => void) => void;

  /**
   * Dispatch an event to the store
   */
  dispatch: (event: TEvents) => void;
}
```

## Usage

```typescript
import { createNativeBridge } from '@open-game-system/app-bridge-native';
import type { AppStores } from './types';

// Create the native bridge with initial state and producers
const bridge = createNativeBridge<AppStores>({
  initialState: {
    counter: { value: 0 }
  },
  producers: {
    counter: (draft, event) => {
      if (event.type === "INCREMENT") {
        draft.value += 1;
      } else if (event.type === "DECREMENT") {
        draft.value -= 1;
      } else if (event.type === "SET") {
        draft.value = event.value;
      }
    }
  }
});

// Get a store
const counterStore = bridge.getStore('counter');

if (counterStore) {
  // Subscribe to state changes
  const unsubscribe = counterStore.subscribe(state => {
    console.log('Counter value:', state.value);
  });

  // Dispatch events
  counterStore.dispatch({ type: "INCREMENT" });

  // Or use produce for more complex state updates
  counterStore.produce(draft => {
    draft.value += 5;
  });

  // Clean up subscription
  unsubscribe();
}
``` 