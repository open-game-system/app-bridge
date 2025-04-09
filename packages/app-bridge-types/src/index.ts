import { Operation } from "fast-json-patch";

/**
 * Represents a generic state type that can be used in stores
 */
export type State = object;

/**
 * Represents a generic event type that can be dispatched to stores
 * Events are discriminated unions with a type field and optional additional properties
 * Example:
 * type CounterEvents =
 *   | { type: "INCREMENT" }
 *   | { type: "SET"; value: number }
 */
export type Event = { type: string };

/**
 * Represents a store definition with its state and event types
 */
export interface StoreDefinition<
  S extends State = State,
  E extends Event = Event
> {
  initialState: S;
  reducers?: Record<string, (state: S, event: E) => S>;
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
 * Represents a store instance with state management capabilities
 */
export interface Store<S extends State = State, E extends Event = Event> {
  /**
   * Get the current state
   */
  getSnapshot(): S;

  /**
   * Dispatch an event to the store
   */
  dispatch(event: E): void;

  /**
   * Subscribe to state changes
   * Returns an unsubscribe function
   */
  subscribe(listener: (state: S) => void): () => void;

  /**
   * Reset store to its initial state
   */
  reset(): void;
}

/**
 * Producer function type for handling events
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
 * Represents the current state of all stores in a bridge
 */
export type BridgeState<TStores extends BridgeStores> = {
  [K in keyof TStores]: TStores[K]["state"] | null;
};

/**
 * Utility type to extract store types from any Bridge implementation
 * Use this to infer the BridgeStores type from a bridge instance
 *
 * Example usage:
 * ```
 * const bridge = createNativeBridge({ ... });
 * type MyStores = ExtractStoresType<typeof bridge>;
 * ```
 */
export type ExtractStoresType<T> = T extends {
  getStore: <K extends keyof (infer U)>(key: K) => any;
}
  ? U
  : never;

/**
 * Represents a WebView instance that can receive JavaScript and handle messages
 */
export interface WebView {
  injectJavaScript: (script: string) => void;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  postMessage: (message: string) => void;
}

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
   * Returns an unsubscribe function
   */
  subscribe: (listener: () => void) => () => void;
}

/**
 * Message types for communication between web and native
 */
export type WebToNativeMessage =
  | { type: "EVENT"; storeKey: string; event: Event }
  | { type: "BRIDGE_READY" };

export type NativeToWebMessage =
  | {
      type: "STATE_INIT";
      storeKey: string;
      data: any;
    }
  | {
      type: "STATE_UPDATE";
      storeKey: string;
      data?: any;
      operations?: Operation[];
    };

/**
 * Native bridge interface with additional capabilities
 */
export interface NativeBridge<TStores extends BridgeStores> extends Bridge<TStores> {
  /**
   * Process a message received from the WebView
   */
  handleWebMessage: (message: string | { nativeEvent: { data: string } }) => void;

  /**
   * Register a WebView to receive state updates
   */
  registerWebView: (webView: WebView) => () => void;

  /**
   * Unregister a WebView from receiving state updates
   */
  unregisterWebView: (webView: WebView) => void;

  /**
   * Subscribe to WebView ready state changes
   * Returns an unsubscribe function
   */
  onWebViewReady: (callback: () => void) => () => void;

  /**
   * Check if any WebView is ready
   */
  isWebViewReady: () => boolean;
}
