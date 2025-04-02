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
 * Represents the web bridge interface
 */
export interface Bridge<TStores extends BridgeStores> {
  /**
   * Check if the bridge is supported in the current environment
   */
  isSupported: () => boolean;

  /**
   * Get the current snapshot of all stores
   * Returns a map of store keys to their current state
   * If a store is not initialized, its value will be null
   */
  getSnapshot: () => BridgeState<TStores>;

  /**
   * Subscribe to changes in a specific store's state
   * @param storeKey The store to subscribe to
   * @param callback The callback to be called when the store's state changes
   */
  subscribe: <K extends keyof TStores>(
    storeKey: K,
    callback: (state: TStores[K]['state']) => void
  ) => () => void;

  /**
   * Dispatch an event to a specific store
   * @param storeKey The store to dispatch to
   * @param event The event to dispatch
   */
  dispatch: <K extends keyof TStores>(storeKey: K, event: TStores[K]['events']) => void;

  /**
   * Reset all stores to their initial state
   */
  reset: () => void;
}

/**
 * Represents a WebView instance that can receive JavaScript and handle messages
 */
export interface WebView {
  injectJavaScript: (script: string) => void;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
}

/**
 * Represents the native bridge interface
 */
export interface NativeBridge<TStores extends BridgeStores> {
  /**
   * Get the current snapshot of all stores
   * Returns a map of store keys to their current state
   * If a store is not initialized, its value will be null
   */
  getSnapshot: () => BridgeState<TStores>;

  /**
   * Subscribe to changes in a specific store's state
   * @param storeKey The store to subscribe to
   * @param callback The callback to be called when the store's state changes
   */
  subscribe: <K extends keyof TStores>(
    storeKey: K,
    callback: (state: TStores[K]['state']) => void
  ) => () => void;

  /**
   * Dispatch an event to a specific store
   * @param storeKey The store to dispatch to
   * @param event The event to dispatch
   */
  dispatch: <K extends keyof TStores>(storeKey: K, event: TStores[K]['events']) => void;

  /**
   * Produce a new state for a store using an immer-style recipe
   * @param storeKey The store to update
   * @param recipe Function that receives a draft of the current state
   */
  produce: <K extends keyof TStores>(
    key: K,
    recipe: (draft: TStores[K]['state']) => void
  ) => void;

  /**
   * Set the state of a store directly
   * @param key The store to update
   * @param state The new state value (can be null to uninitialize)
   */
  setState: <K extends keyof TStores>(
    key: K,
    state: TStores[K]['state'] | null
  ) => void;

  /**
   * Registers a WebView to receive state updates.
   * This will automatically set up message handling and inject the necessary JavaScript.
   */
  registerWebView: (webView: WebView) => void;

  /**
   * Unregisters a WebView from receiving state updates.
   * This will clean up message handlers.
   */
  unregisterWebView: (webView: WebView) => void;
}

/**
 * Represents a store context that provides access to a specific store
 */
export interface StoreContext<S extends State = State, E extends Event = Event> {
  store: Store<S, E>;
  isInitialized: boolean;
  error: Error | null;
} 