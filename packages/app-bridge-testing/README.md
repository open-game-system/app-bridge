# @open-game-system/app-bridge-testing

Testing utilities for the app-bridge ecosystem.

## Installation

```bash
npm install @open-game-system/app-bridge-testing --save-dev
# or
yarn add @open-game-system/app-bridge-testing --dev
# or
pnpm add @open-game-system/app-bridge-testing --save-dev
```

## API Reference

### createMockBridge

```typescript
/**
 * Creates a mock bridge for testing purposes
 * This implementation mimics the behavior of a real bridge but allows
 * for more control and inspection during tests
 * @template TStores Store definitions for the bridge
 * @param config Configuration options for the mock bridge
 * @returns A MockBridge instance with additional testing utilities
 */
export function createMockBridge<TStores extends BridgeStores>(
  config?: {
    /**
     * Whether the bridge is supported in the current environment
     */
    isSupported?: boolean;

    /**
     * Initial state for stores in the bridge
     * When provided, stores will be pre-initialized with these values
     */
    initialState?: Partial<{
      [K in keyof TStores]: TStores[K]["state"];
    }>;
  }
): MockBridge<TStores>;
```

### MockBridge Interface

```typescript
/**
 * Extended Bridge interface with additional testing utilities
 */
export interface MockBridge<TStores extends BridgeStores> extends Omit<Bridge<TStores>, "getSnapshot"> {
  /**
   * Get a store by its key.
   * Always returns a store (creating one if it doesn't exist)
   */
  getStore: <K extends keyof TStores>(
    storeKey: K
  ) => MockStore<TStores[K]["state"], TStores[K]["events"]> | undefined;

  /**
   * Get all events that have been dispatched to a store
   * Creates an empty event history array if one doesn't exist
   */
  getHistory: <K extends keyof TStores>(storeKey: K) => TStores[K]["events"][];

  /**
   * Reset a store's state and clear its event history
   * If no storeKey is provided, resets all stores
   */
  reset: (storeKey?: keyof TStores) => void;

  /**
   * Set the state of a store
   * Creates the store if it doesn't already exist
   */
  setState: <K extends keyof TStores>(
    storeKey: K,
    state: TStores[K]["state"]
  ) => void;

  /**
   * Check if the bridge is supported
   */
  isSupported: () => boolean;
}
```

### MockStore Interface

```typescript
/**
 * Interface for a mock store that includes testing utilities
 */
export interface MockStore<TState extends State, TEvent extends Event>
  extends Store<TState, TEvent> {
  /**
   * Directly modify the state using a producer function
   * Only available in mock bridge
   */
  produce: (producer: (state: TState) => void) => void;

  /**
   * Reset the store's state to undefined and notify listeners
   */
  reset: () => void;

  /**
   * Set the store's complete state and notify listeners
   */
  setState: (state: TState) => void;
}
```

## Usage

```typescript
import { createMockBridge } from '@open-game-system/app-bridge-testing';
import type { AppStores } from './types';

// Create a mock bridge with initial state
const bridge = createMockBridge<AppStores>({
  isSupported: true,
  initialState: {
    counter: { value: 0 }
  }
});

// Get a store
const counterStore = bridge.getStore('counter');

if (counterStore) {
  // Test state changes
  counterStore.setState({ value: 5 });
  expect(counterStore.getSnapshot().value).toBe(5);

  // Test event dispatching
  counterStore.dispatch({ type: "INCREMENT" });
  expect(bridge.getHistory('counter')).toEqual([
    { type: "INCREMENT" }
  ]);

  // Test state updates
  counterStore.produce(state => {
    state.value += 1;
  });
  expect(counterStore.getSnapshot().value).toBe(6);

  // Reset the store
  counterStore.reset();
  expect(counterStore.getSnapshot().value).toBe(0);
  expect(bridge.getHistory('counter')).toEqual([]);
} 