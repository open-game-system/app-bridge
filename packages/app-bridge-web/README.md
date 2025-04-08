# @open-game-system/app-bridge-web

Web-specific implementation of the app-bridge ecosystem.

## Installation

```bash
npm install @open-game-system/app-bridge-web
# or
yarn add @open-game-system/app-bridge-web
# or
pnpm add @open-game-system/app-bridge-web
```

## API Reference

### createWebBridge

```typescript
/**
 * Creates a web bridge instance for use in web applications
 * This implementation receives state from the native side through WebView messages
 * @template TStores Store definitions for the bridge
 * @returns A Bridge instance
 */
export function createWebBridge<TStores extends BridgeStores>(): Bridge<TStores>;
```

### Bridge Interface

```typescript
/**
 * Represents the web bridge interface
 */
export interface Bridge<TStores extends BridgeStores> {
  /**
   * Check if the bridge is supported in the current environment
   * For web bridge, this checks if ReactNativeWebView is available
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
   * Subscribe to store availability changes
   * Returns an unsubscribe function
   */
  subscribe: (listener: () => void) => () => void;
}
```

## Usage

```typescript
import { createWebBridge } from '@open-game-system/app-bridge-web';
import type { AppStores } from './types';

// Create the web bridge
const bridge = createWebBridge<AppStores>();

// Check if bridge is supported
if (bridge.isSupported()) {
  // Get a store
  const counterStore = bridge.getStore('counter');
  
  if (counterStore) {
    // Subscribe to state changes
    const unsubscribe = counterStore.subscribe(state => {
      console.log('Counter value:', state.value);
    });

    // Dispatch events
    counterStore.dispatch({ type: "INCREMENT" });

    // Clean up subscription
    unsubscribe();
  }
}
``` 