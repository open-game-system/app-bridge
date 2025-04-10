# @open-game-system/app-bridge-react

React hooks and components designed for integrating the `@open-game-system/app-bridge-web` package into standard web React applications.

## Installation

```bash
npm install @open-game-system/app-bridge-react
# or
yarn add @open-game-system/app-bridge-react
# or
pnpm add @open-game-system/app-bridge-react
```

## API Reference

### createBridgeContext

```typescript
/**
 * Creates a context and hooks for interacting with the bridge
 * @template TStores Store definitions for the bridge
 * @returns A set of components and hooks for interacting with the bridge
 */
export function createBridgeContext<TStores extends BridgeStores>(): {
  /**
   * Provider component that makes the bridge available to child components
   */
  Provider: React.FC<{
    children: ReactNode;
    bridge: Bridge<TStores>;
  }>;

  /**
   * Creates a set of hooks and components for interacting with a specific store
   * @param storeKey The key of the store to interact with
   * @returns A set of hooks and components for the specific store
   */
  createStoreContext: <K extends keyof TStores>(storeKey: K) => {
    /**
     * Provider component that automatically subscribes to store availability
     * and provides the store when it becomes available
     */
    Provider: React.FC<{ children: ReactNode }>;

    /**
     * Loading component that renders children only when the bridge is supported
     * but the store is not yet available
     */
    Loading: React.FC<{ children: ReactNode }>;

    /**
     * Hook to access the store
     * Must be used inside a Store.Provider component
     */
    useStore: () => Store<TStores[K]["state"], TStores[K]["events"]>;

    /**
     * Hook to select data from the store
     * Must be used inside a Store.Provider component
     */
    useSelector: <T>(selector: (state: TStores[K]["state"]) => T) => T;
  };

  /**
   * Renders children only when the bridge is supported
   */
  Supported: React.FC<{ children: ReactNode }>;

  /**
   * Renders children only when the bridge is not supported
   */
  Unsupported: React.FC<{ children: ReactNode }>;
};
```

## Usage

```typescript
import { createBridgeContext } from '@open-game-system/app-bridge-react';
import type { AppStores } from './types';

// Create the bridge context
const { Provider, createStoreContext, Supported, Unsupported } = createBridgeContext<AppStores>();

// Create a store context for the counter store
const { Provider: CounterProvider, Loading: CounterLoading, useStore: useCounterStore, useSelector: useCounterSelector } = createStoreContext('counter');

// Use in your app
function App() {
  return (
    <Provider bridge={bridge}>
      <Supported>
        <CounterProvider>
          <Counter>
            <CounterLoading>
              <div>Loading counter...</div>
            </CounterLoading>
          </Counter>
        </CounterProvider>
      </Supported>
      <Unsupported>
        <div>Bridge not supported in this environment</div>
      </Unsupported>
    </Provider>
  );
}

function Counter() {
  // Get the store directly
  const counterStore = useCounterStore();
  
  // Or use a selector to get specific state
  const value = useCounterSelector(state => state.value);
  
  return (
    <div>
      <p>Counter value: {value}</p>
      <button onClick={() => counterStore.dispatch({ type: "INCREMENT" })}>
        Increment
      </button>
    </div>
  );
} 