/**
 * Base interface for all state objects in the bridge.
 * Each state must be an object with string keys and unknown values.
 * This allows for type-safe state management while maintaining flexibility.
 */
export interface State {
  [key: string]: unknown;
}

/**
 * Base type for all events in the bridge.
 * Events are discriminated unions with a 'type' field.
 * The 'SET' event is special as it requires a 'value' field.
 * Other events can have any type string and additional properties.
 */
export type Event =
  | {
      type: "SET";
      value: unknown;
    }
  | {
      type: string;
    };

/**
 * Base interface for a store that manages state and handles events.
 * Each store is generic over its specific state and event types.
 *
 * @template TState - The specific state type for this store
 * @template TEvent - The specific event type for this store
 */
export interface Store<TState extends State, TEvent extends Event> {
  /** Get the current state snapshot - never returns undefined */
  getSnapshot: () => TState;
  /** Subscribe to state changes */
  subscribe: (listener: (state: TState) => void) => () => void;
  /** Dispatch an event to update the state */
  dispatch: (event: TEvent) => void;
}

/**
 * Interface for a mock store that includes testing utilities.
 * This is only used in the mock bridge for testing purposes.
 */
export interface MockStore<TState extends State, TEvent extends Event> extends Store<TState, TEvent> {
  /** Directly modify the state using a producer function - only available in mock bridge */
  produce: (producer: (state: TState) => void) => void;
  /** Reset the store's state to undefined and notify listeners */
  reset: () => void;
  /** Set the store's complete state and notify listeners */
  setState: (state: TState) => void;
}

/**
 * Type for defining the shape of all stores in a bridge.
 * Each store definition specifies its state and event types.
 *
 * Example:
 * ```typescript
 * interface CounterState extends State {
 *   value: number;
 * }
 *
 * type CounterEvent =
 *   | { type: 'INCREMENT' }
 *   | { type: 'DECREMENT' }
 *   | { type: 'SET'; value: number };
 *
 * interface AppStores extends BridgeStoreDefinitions {
 *   counter: {
 *     state: CounterState;
 *     events: CounterEvent;
 *   };
 * }
 * ```
 */
export interface BridgeStoreDefinitions {
  [key: string]: {
    state: State;
    events: Event;
  };
}

/**
 * Interface for the bridge that connects web and native environments.
 * The bridge provides access to stores and checks for environment support.
 *
 * @template TStores - The type of store definitions for this bridge
 */
export interface Bridge<TStores extends BridgeStoreDefinitions = BridgeStoreDefinitions> {
  /**
   * Get a store by its key.
   * Returns undefined if the store is not available.
   */
  getStore: <K extends keyof TStores>(
    key: K
  ) => Store<TStores[K]["state"], TStores[K]["events"]> | undefined;

  /** 
   * Subscribe to store availability changes.
   * Called when a store becomes available or unavailable.
   */
  subscribe: (listener: () => void) => () => void;

  /** Check if the bridge is supported in the current environment */
  isSupported: () => boolean;
}

/**
 * Utility type to extract the store definitions from a bridge instance.
 * This is useful when you want to get the store types from an existing bridge.
 * 
 * @template T - The bridge instance type
 */
export type StoresFromBridge<T> = T extends Bridge<infer U> ? U : never;
