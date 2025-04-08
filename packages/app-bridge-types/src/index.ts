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
  getSnapshot(): S;
  dispatch(event: E): void;
  subscribe(listener: (state: S) => void): () => void;
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

export type NativeToWebMessage = {
  type: "STATE_INIT";
  storeKey: string;
  data: any;
} | {
  type: "STATE_UPDATE";
  storeKey: string;
  data?: any;
  operations?: Operation[];
};

/**
 * Native-specific store interface with additional capabilities
 */
export interface NativeStore<TState extends State, TEvent extends Event>
  extends Store<TState, TEvent> {
  produce: (producer: (draft: TState) => void) => void;
}

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
   * Produce a new state for a store using Immer
   */
  produce: <K extends keyof TStores>(
    storeKey: K,
    producer: (draft: TStores[K]["state"]) => void
  ) => void;

  /**
   * Set the state of a store directly
   */
  setState: <K extends keyof TStores>(
    key: K,
    newState: TStores[K]["state"] | undefined
  ) => void;

  /**
   * Reset stores to their initial state
   */
  reset: (storeKey?: keyof TStores) => void;

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