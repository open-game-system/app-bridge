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
 * (This type might be less relevant with the simplified config)
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
// Ensure Store interface is simplified according to Plan v4
export interface Store<S extends State = State, E extends Event = Event> {
  /**
   * Get the current state
   */
  getSnapshot(): S;

  /**
   * Dispatch an event to the store. Returns a Promise that resolves when listeners complete.
   */
  dispatch(event: E): void; // Revert to void return type

  /**
   * Subscribe to state changes
   * Returns an unsubscribe function
   */
  subscribe(listener: (state: S) => void): () => void;

  /**
   * Reset store to its initial state
   */
  reset(): void;

  /**
   * Add a listener for specific dispatched events.
   * @param eventType The type of the dispatched event (E['type']).
   * @param listener The callback function (potentially async) receiving the event and store instance.
   * @returns An unsubscribe function.
   */
  // Ensure signature matches Plan v4
  on<EventType extends E['type']>(
    eventType: EventType,
    listener: (
      event: Extract<E, { type: EventType }>,
      store: Store<S, E> // Pass store instance
    ) => Promise<void> | void // Allow async
  ): () => void;
}

/**
 * Producer function type for handling events (simplified)
 */
export type Producer<S extends State, E extends Event> = (draft: S, event: E) => void;

/**
 * Defines the configuration for declarative event listeners within a store.
 */
export type StoreOnConfig<S extends State, E extends Event> = Partial<{
  [K in E['type']]: (
    event: Extract<E, { type: K }>,
    store: Store<S, E>
  ) => Promise<void> | void;
}>;

/**
 * Store configuration for creating new stores (simplified)
 */
export interface StoreConfig<S extends State, E extends Event> {
  initialState: S;
  producer?: Producer<S, E>;
  on?: StoreOnConfig<S, E>; // Optional 'on' config
}

/**
 * Creates a new store with the given configuration (simplified)
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
 */
export type ExtractStoresType<T> = T extends {
  getStore: <K extends keyof (infer U)>(key: K) => any;
} ? U : never;

/**
 * Represents a WebView instance that can receive JavaScript and handle messages
 * Keep this minimal interface as required by the bridge implementations.
 */
export interface WebView {
  injectJavaScript?: (script: string) => void;
  postMessage?: (message: string) => void;
  // Add other methods ONLY if used by createNativeBridge or createWebBridge
  // onMessage?: (event: { nativeEvent: { data: string } }) => void; // Usually handled by props/registration
}

/**
 * Base bridge interface - applicable to both web and native contexts
 */
export interface Bridge<TStores extends BridgeStores> {
  isSupported: () => boolean;
  getStore: <K extends keyof TStores>(
    storeKey: K
  ) => Store<TStores[K]["state"], TStores[K]["events"]> | undefined;
  setStore: <K extends keyof TStores>(
    key: K,
    store: Store<TStores[K]["state"], TStores[K]["events"]> | undefined
  ) => void;
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
  handleWebMessage: (message: string | { nativeEvent: { data: string } }) => void;
  registerWebView: (webView: WebView | null | undefined) => () => void;
  unregisterWebView: (webView: WebView | null | undefined) => void;
  subscribeToReadyState: (
    webView: WebView | null | undefined,
    callback: (isReady: boolean) => void
  ) => () => void;
  getReadyState: (webView: WebView | null | undefined) => boolean;
}
