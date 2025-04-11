import { Operation } from "fast-json-patch";

export type { Operation };

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
 * Base bridge interface - applicable to both web and native contexts
 * NOTE: isSupported is primarily for the web context.
 */
export interface Bridge<TStores extends BridgeStores> {
  /**
   * Check if the bridge environment (e.g., ReactNativeWebView) is available.
   * Returns true on native by default, checks for WebView on web.
   */
  isSupported: () => boolean; // Keep for base, native impl can just return true

  getStore: <K extends keyof TStores>(
    storeKey: K
  ) => Store<TStores[K]["state"], TStores[K]["events"]> | undefined;

  setStore: <K extends keyof TStores>(
    key: K,
    store: Store<TStores[K]["state"], TStores[K]["events"]> | undefined
  ) => void;

  /**
   * Subscribe to general bridge events (like store registration/unregistration).
   * Returns an unsubscribe function.
   */
  subscribe: (listener: () => void) => () => void;
}

/**
 * Message types for communication between web and native
 */
export type WebToNativeMessage =
  | { type: "EVENT"; storeKey: string; event: Event }
  | { type: "BRIDGE_READY" };

export type NativeToWebMessage<TStores extends BridgeStores> =
  | {
      type: "STATE_INIT";
      storeKey: keyof TStores;
      data: TStores[keyof TStores]["state"];
    }
  | {
      type: "STATE_UPDATE";
      storeKey: keyof TStores;
      data?: TStores[keyof TStores]["state"];
      operations?: Operation[];
    };

/**
 * Native bridge interface with additional capabilities specific to the native side.
 */
export interface NativeBridge<TStores extends BridgeStores> extends Bridge<TStores> {
  // isSupported is inherited, native impl should return true.
  
  /**
   * Process a message received from a WebView.
   */
  handleWebMessage: (message: string | { nativeEvent: { data: string } }) => void;

  /**
   * Register a WebView instance to sync state with.
   * Returns an unsubscribe/cleanup function.
   */
  registerWebView: (webView: WebView | null | undefined) => () => void;

  /**
   * Unregister a WebView instance.
   */
  unregisterWebView: (webView: WebView | null | undefined) => void;

  /**
   * Subscribe to ready state changes for a specific WebView.
   * The callback receives true when the WebView sends BRIDGE_READY.
   * Returns an unsubscribe function.
   */
  subscribeToReadyState: ( 
    webView: WebView | null | undefined, 
    callback: (isReady: boolean) => void
  ) => () => void;

  /**
   * Get the current ready state for a specific WebView.
   */
  getReadyState: (webView: WebView | null | undefined) => boolean;
}
