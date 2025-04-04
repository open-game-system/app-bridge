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
 * Message types for communication between web and native environments
 */

// Import the Operation type from fast-json-patch 
import { Operation } from 'fast-json-patch';

// Messages from web to native
export interface WebToNativeMessage<TEvent extends Event = Event> {
  type: "EVENT";
  storeKey: string;
  event: TEvent;
}

// Messages from native to web
export type NativeToWebMessage<TState extends State = State> =
  | {
      type: "STATE_INIT";
      storeKey: string;
      data: TState;
    }
  | {
      type: "STATE_UPDATE";
      storeKey: string;
      operations: Operation[];
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
 * Interface for a store in the native environment.
 * Native stores support both direct state modification and event handling.
 * 
 * @template TState - The specific state type for this store
 * @template TEvent - The specific event type for this store
 */
export interface NativeStore<TState extends State, TEvent extends Event = Event> {
  /** Get the current state snapshot - never returns undefined */
  getSnapshot: () => TState;
  /** Subscribe to state changes */
  subscribe: (listener: (state: TState) => void) => () => void;
  /** Update state using immer-style producer function */
  produce: (producer: (draft: TState) => void) => void;
  /** Dispatch an event to update the state - primarily for internal use */
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
 */
export interface BridgeStoreDefinitions {
  [key: string]: {
    state: State;
    events: Event;
  };
}

/**
 * Type for defining the shape of all stores in a bridge with specific typings.
 * This is useful when you need more control over the type constraints.
 */
export type TypedBridgeStoreDefinitions<
  TState extends State = State,
  TEvent extends Event = Event
> = {
  [key: string]: {
    state: TState;
    events: TEvent;
  };
};

/**
 * Alias for BridgeStoreDefinitions for backward compatibility
 */
export type BridgeStores = BridgeStoreDefinitions;

/**
 * Interface for the web bridge that connects to native environments.
 * The web bridge provides access to stores and checks for environment support.
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
 * Interface for the native bridge that hosts WebViews and manages state.
 * 
 * @template TStores - The type of store definitions for this bridge
 */
export interface NativeBridge<TStores extends BridgeStoreDefinitions = BridgeStoreDefinitions> {
  /**
   * Get a store by its key.
   * Returns undefined if the store is not available.
   * Note: Native stores only provide getSnapshot and subscribe methods.
   */
  getStore: <K extends keyof TStores>(
    key: K
  ) => NativeStore<TStores[K]["state"], TStores[K]["events"]> | undefined;

  /**
   * Subscribe to store availability changes.
   * Called when a store becomes available or unavailable.
   */
  subscribe: (listener: () => void) => () => void;

  /**
   * Register a WebView to receive state updates
   */
  registerWebView: (webView: { injectJavaScript: (script: string) => void; onMessage?: (event: { data: string }) => void }) => void;
  
  /**
   * Unregister a WebView from receiving state updates
   */
  unregisterWebView: (webView: { injectJavaScript: (script: string) => void; onMessage?: (event: { data: string }) => void }) => void;
  
  /**
   * Update state using immer-style producer function
   */
  produce: <K extends keyof TStores>(
    storeKey: K, 
    producer: (draft: TStores[K]['state']) => void
  ) => void;
  
  /**
   * Set state directly for a specific store
   */
  setState: <K extends keyof TStores>(
    key: K, 
    newState: TStores[K]['state'] | undefined
  ) => void;
  
  /**
   * Reset state to initial values
   */
  reset: (storeKey?: keyof TStores) => void;
  
  /**
   * Handle events received from WebViews
   * This method is only for internal use and not exposed to native applications
   */
  dispatch: <K extends keyof TStores>(
    storeKey: K, 
    event: TStores[K]['events']
  ) => void;
  
  /** Check if the bridge is supported in the current environment */
  isSupported: () => boolean;
}

/**
 * Utility type to extract the store definitions from a bridge instance.
 * This is useful when you want to get the store types from an existing bridge.
 * 
 * @template T - The bridge instance type
 */
export type StoresFromBridge<T> = 
  T extends Bridge<infer U> ? U : 
  T extends NativeBridge<infer U> ? U : never;
