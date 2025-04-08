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
export type Event = {
  type: string;
};

/**
 * Represents a store definition with its state and event types
 */
export interface StoreDefinition<S extends State = State, E extends Event = Event> {
  initialState: S;
  reducers?: Record<string, (state: S, event: E) => S>;
}

/**
 * Represents a collection of store definitions
 */
export type BridgeStores = Record<string, { state: State; events: Event }>;

/**
 * Represents a store instance with state management capabilities
 */
export interface Store<S extends State = State, E extends Event = Event> {
  /** Get the current state snapshot */
  getSnapshot(): S;
  /** Subscribe to state changes */
  subscribe(listener: (state: S) => void): () => void;
  /** Dispatch an event to update the state */
  dispatch(event: E): void;
}

/**
 * Represents the current state of all stores in a bridge
 */
export type BridgeState<TStores extends BridgeStores> = {
  [K in keyof TStores]: TStores[K]['state'] | null;
};

/**
 * Represents a WebView instance that can receive JavaScript and handle messages
 */
export interface WebView {
  injectJavaScript: (script: string) => void;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
}

/**
 * Represents a store context that provides access to a specific store
 */
export interface StoreContext<S extends State = State, E extends Event = Event> {
  store: Store<S, E>;
  isInitialized: boolean;
  error: Error | null;
}
```

## Usage

```typescript
import type { State, Event, Store, BridgeStores } from '@open-game-system/app-bridge-types';

// Define your application's state and events
export interface CounterState extends State {
  value: number;
}

export type CounterEvents = 
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };

// Define your application's stores
export type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};
``` 