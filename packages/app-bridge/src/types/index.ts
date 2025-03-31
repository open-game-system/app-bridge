/**
 * Represents a generic state type that can be used in stores
 */
export type State = Record<string, unknown>;

/**
 * Represents a generic event type that can be dispatched to stores
 */
export type Event = {
  type: string;
  payload?: unknown;
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
export type BridgeStores = Record<string, StoreDefinition>;

/**
 * Represents a store instance with state management capabilities
 */
export interface Store<S extends State = State, E extends Event = Event> {
  getState(): S;
  dispatch(event: E): void;
  subscribe(listener: (state: S) => void): () => void;
}

/**
 * Represents the base bridge interface
 */
export interface Bridge {
  isSupported(): boolean;
  getStore<K extends keyof BridgeStores>(key: K): Promise<Store>;
}

/**
 * Represents the native bridge interface with additional capabilities
 */
export interface NativeBridge extends Bridge {
  produce<K extends keyof BridgeStores>(
    key: K,
    recipe: (draft: BridgeStores[K]['initialState']) => void
  ): Promise<void>;
}

/**
 * Represents a store context that provides access to a specific store
 */
export interface StoreContext<S extends State = State, E extends Event = Event> {
  store: Store<S, E>;
  isInitialized: boolean;
  error: Error | null;
} 