// Testing utilities will go here
import { Bridge, BridgeStoreDefinitions, Event, State, Store } from "../types";

/**
 * Interface for a mock store that includes testing utilities.
 * This is only used in the mock bridge for testing purposes.
 */
export interface MockStore<TState extends State, TEvent extends Event>
  extends Store<TState, TEvent> {
  /** Directly modify the state using a producer function - only available in mock bridge */
  produce: (producer: (state: TState) => void) => void;
  /** Reset the store's state to undefined and notify listeners */
  reset: () => void;
  /** Set the store's complete state and notify listeners */
  setState: (state: TState) => void;
}

/**
 * Configuration options for creating a mock bridge
 * @template TStores Store definitions for the bridge
 */
export interface MockBridgeConfig<
  TStores extends BridgeStoreDefinitions = BridgeStoreDefinitions
> {
  /**
   * Whether the bridge is supported in the current environment
   */
  isSupported?: boolean;

  /**
   * Initial state for stores in the bridge
   * When provided, stores will be pre-initialized with these values
   */
  initialState?: Partial<{
    [K in keyof TStores]: TStores[K]["state"];
  }>;
}

/**
 * Extended Bridge interface with additional testing utilities
 * @template TStores Store definitions for the bridge
 */
export interface MockBridge<TStores extends BridgeStoreDefinitions>
  extends Omit<Bridge<TStores>, "getSnapshot"> {
  /**
   * Get a store by its key.
   * Always returns a store (creating one if it doesn't exist)
   */
  getStore: <K extends keyof TStores>(
    storeKey: K
  ) => MockStore<TStores[K]["state"], TStores[K]["events"]> | undefined;

  /**
   * Get all events that have been dispatched to a store
   * Creates an empty event history array if one doesn't exist
   */
  getHistory: <K extends keyof TStores>(storeKey: K) => TStores[K]["events"][];

  /**
   * Reset a store's state and clear its event history
   * If no storeKey is provided, resets all stores
   */
  reset: (storeKey?: keyof TStores) => void;

  /**
   * Set the state of a store
   * Creates the store if it doesn't already exist
   */
  setState: <K extends keyof TStores>(
    storeKey: K,
    state: TStores[K]["state"]
  ) => void;

  /**
   * Check if the bridge is supported
   */
  isSupported: () => boolean;
}

/**
 * Creates a mock bridge for testing purposes
 * This implementation mimics the behavior of a real bridge but allows
 * for more control and inspection during tests
 *
 * @template TStores Store definitions for the bridge
 * @param config Configuration options for the mock bridge
 * @returns A MockBridge instance with additional testing utilities
 */
export function createMockBridge<TStores extends BridgeStoreDefinitions>(
  config: MockBridgeConfig<TStores> = {}
): MockBridge<TStores> {
  // Store instances by key
  const stores = new Map<
    keyof TStores,
    MockStore<TStores[keyof TStores]["state"], TStores[keyof TStores]["events"]>
  >();

  // Listeners for state changes by store key
  const stateListeners = new Map<
    keyof TStores,
    Set<(state: TStores[keyof TStores]["state"]) => void>
  >();

  // Listeners for store availability changes
  const storeListeners = new Set<() => void>();

  // Event history for each store
  const eventHistory = new Map<
    keyof TStores,
    TStores[keyof TStores]["events"][]
  >();

  /**
   * Notify all listeners for a specific store's state changes
   */
  const notifyStateListeners = <K extends keyof TStores>(storeKey: K) => {
    const listeners = stateListeners.get(storeKey);
    const store = stores.get(storeKey);
    if (listeners && store) {
      const state = store.getSnapshot();
      if (state) {
        listeners.forEach((listener) => listener(state));
      }
    }
  };

  /**
   * Notify all listeners that a store's availability has changed
   */
  const notifyStoreListeners = () => {
    storeListeners.forEach((listener) => listener());
  };

  /**
   * Create a new store for a specific key
   * This is called when a store is explicitly created with state
   */
  const createStore = <K extends keyof TStores>(
    storeKey: K,
    initialState: TStores[K]["state"]
  ) => {
    let currentState: TStores[K]["state"] = initialState;

    const store = {
      /**
       * Get the current state of the store
       */
      getSnapshot: () => {
        return currentState;
      },

      /**
       * Subscribe to state changes for this store
       * Returns an unsubscribe function
       */
      subscribe: (listener: (state: TStores[K]["state"]) => void) => {
        if (!stateListeners.has(storeKey)) {
          stateListeners.set(storeKey, new Set());
        }
        const listeners = stateListeners.get(storeKey)!;
        listeners.add(listener);

        // Notify immediately since state must exist
        listener(currentState);

        return () => {
          listeners.delete(listener);
        };
      },

      /**
       * Dispatch an event to the store
       * In the mock implementation, this just records the event
       */
      dispatch: (event: TStores[K]["events"]) => {
        if (!eventHistory.has(storeKey)) {
          eventHistory.set(storeKey, []);
        }
        eventHistory.get(storeKey)!.push(event);
      },

      /**
       * Update the state using a producer function
       * This allows for direct state manipulation in tests
       */
      produce: (producer: (state: TStores[K]["state"]) => void) => {
        const newState = { ...currentState };
        producer(newState);
        currentState = newState;
        notifyStateListeners(storeKey);
      },

      /**
       * Reset the store to its initial state
       * Also clears the event history
       */
      reset: () => {
        const storeInitialState = config.initialState?.[storeKey];
        if (storeInitialState) {
          currentState = { ...storeInitialState };
        }
        if (eventHistory.has(storeKey)) {
          eventHistory.get(storeKey)!.length = 0;
        }
        notifyStateListeners(storeKey);
        notifyStoreListeners();
      },

      /**
       * Directly set the state of the store
       */
      setState: (state: TStores[K]["state"]) => {
        currentState = state;
        notifyStateListeners(storeKey);
        notifyStoreListeners();
      },
    } satisfies MockStore<TStores[K]["state"], TStores[K]["events"]>;

    stores.set(storeKey, store);
    return store;
  };

  // Initialize stores with initial state if provided
  if (config.initialState) {
    for (const [key, state] of Object.entries(config.initialState)) {
      createStore(key as keyof TStores, state);
    }
  }

  return {
    /**
     * Check if the bridge is supported
     * In the mock implementation, this returns the configured value or true by default
     */
    isSupported: () => config.isSupported ?? true,

    /**
     * Get a store by its key
     * Returns undefined if the store doesn't exist
     */
    getStore: <K extends keyof TStores>(storeKey: K) => {
      return stores.get(storeKey);
    },

    /**
     * Get the history of events dispatched to a store
     * Creates an empty array if none exists
     */
    getHistory: <K extends keyof TStores>(storeKey: K) => {
      if (!eventHistory.has(storeKey)) {
        eventHistory.set(storeKey, []);
      }
      return eventHistory.get(storeKey)!;
    },

    /**
     * Reset a specific store or all stores
     * This resets the state and clears event history
     */
    reset: (storeKey?: keyof TStores) => {
      if (storeKey) {
        const store = stores.get(storeKey);
        if (store) {
          store.reset();
        }
      } else {
        // Reset all stores
        for (const [_, store] of stores.entries()) {
          store.reset();
        }
      }
    },

    /**
     * Set the state of a store
     * Creates the store if it doesn't exist or updates state if it does
     */
    setState: <K extends keyof TStores>(
      storeKey: K,
      state: TStores[K]["state"]
    ) => {
      let store = stores.get(storeKey);
      if (!store) {
        store = createStore(storeKey, state);
      } else {
        store.setState(state);
      }
      notifyStoreListeners();
    },

    /**
     * Subscribe to store availability changes
     * Returns an unsubscribe function
     */
    subscribe: (listener: () => void) => {
      storeListeners.add(listener);
      return () => {
        storeListeners.delete(listener);
      };
    },
  };
}
