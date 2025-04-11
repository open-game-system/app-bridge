import type { WebView, State, Event } from '@open-game-system/app-bridge-types';

/**
 * Base type for state objects
 */
export type { State };

/**
 * Base type for event objects
 */
export type { Event };

/**
 * Store interface with standard methods
 */
export interface Store<S = any, E = any> {
  getSnapshot(): S;
  dispatch(event: E): void;
  subscribe(listener: (state: S) => void): () => void;
}

/**
 * Bridge stores type for type-safety
 */
export type BridgeStores = Record<string, { state: State; events: Event }>;

/**
 * Interface for a mock store that includes testing utilities.
 * This is only used in the mock bridge for testing purposes.
 */
export interface MockStore<TState extends State = State, TEvent extends Event = Event>
  extends Store<TState, TEvent> {
  /** Directly modify the state using a producer function - only available in mock bridge */
  produce: (producer: (state: TState) => void) => void;
  /** Reset the store's state to undefined and notify listeners */
  reset: () => void;
  /** Set the store's complete state and notify listeners */
  setState: (state: TState) => void;
  /**
   * Add the 'on' method signature to satisfy the Store interface
   */
  on: <EventType extends TEvent['type']>(
    eventType: EventType,
    listener: (event: Extract<TEvent, { type: EventType }>, store: Store<TState, TEvent>) => Promise<void> | void
  ) => () => void;
}

/**
 * Configuration options for creating a mock bridge
 * @template TStores Store definitions for the bridge
 */
export interface MockBridgeConfig<
  TStores extends BridgeStores = BridgeStores
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
 * Core Bridge interface
 */
export interface Bridge<TStores extends BridgeStores = BridgeStores> {
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
 * Extended Bridge interface with additional testing utilities
 * @template TStores Store definitions for the bridge
 */
export interface MockBridge<TStores extends BridgeStores>
  extends Bridge<TStores> {
  /**
   * Get a store by its key
   * Returns undefined if the store doesn't exist
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

  /**
   * Set or remove a store for a given key
   */
  setStore: <K extends keyof TStores>(
    key: K,
    store: Store<TStores[K]["state"], TStores[K]["events"]> | undefined
  ) => void;
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
export function createMockBridge<TStores extends BridgeStores>(
  config: MockBridgeConfig<TStores> = {}
): MockBridge<TStores> {
  const stores = new Map<keyof TStores, MockStore<any, any>>();
  const stateByStore = new Map<keyof TStores, TStores[keyof TStores]["state"]>();
  const stateListeners = new Map<keyof TStores, Set<(state: any) => void>>();
  const storeListeners = new Set<() => void>();
  const eventHistory = new Map<keyof TStores, any[]>();
  const eventListeners = new Map<
      keyof TStores,
      Map<string, Set<(event: any, store: Store<any, any>) => Promise<void> | void>>
  >();

  const webViews = new Set<WebView>();
  const readyWebViews = new Set<WebView>();
  const readyStateListeners = new Set<() => void>();

  const notifyStateListeners = (storeKey: keyof TStores) => {
    const listeners = stateListeners.get(storeKey);
    if (listeners && stateByStore.has(storeKey)) {
      listeners.forEach((listener) => listener(stateByStore.get(storeKey)!));
    }
  };

  const notifyStoreListeners = () => {
    storeListeners.forEach((listener) => listener());
  };

  const notifyReadyStateListeners = () => {
    readyStateListeners.forEach((listener) => listener());
  };

  const notifyEventListeners = (
      storeKey: keyof TStores,
      eventType: string,
      event: TStores[keyof TStores]["events"],
      storeInstance: Store<any, any>
  ) => {
      const storeEventListeners = eventListeners.get(storeKey);
      const listeners = storeEventListeners?.get(eventType);
      if (listeners) {
          listeners.forEach(listener => {
              try {
                  const result = listener(event, storeInstance);
                  if (result instanceof Promise) {
                      result.catch(error => {
                          console.error(`[Mock Bridge] Unhandled promise rejection in async event listener for type "${eventType}" on store "${String(storeKey)}":`, error);
                      });
                  }
              } catch (error) {
                  console.error(`[Mock Bridge] Error in event listener for type "${eventType}" on store "${String(storeKey)}":`, error);
              }
          });
      }
  };

  const getOrCreateStore = <K extends keyof TStores>(
    storeKey: K
  ): MockStore<TStores[K]["state"], TStores[K]["events"]> => {
    if (stores.has(storeKey)) {
      return stores.get(storeKey)! as MockStore<TStores[K]["state"], TStores[K]["events"]>;
    }

    // Ensure state is tracked if not already
    if (!stateByStore.has(storeKey) && config.initialState?.[storeKey]) {
        stateByStore.set(storeKey, config.initialState[storeKey]!);
    }

    // Create the actual store object with all methods
    const storeInstance: MockStore<TStores[K]["state"], TStores[K]["events"]> = {
      getSnapshot: (): TStores[K]["state"] => {
        // Provide initial state if current state is somehow undefined
        return stateByStore.get(storeKey) ?? config.initialState?.[storeKey]!;
      },

      subscribe: (listener: (state: TStores[K]["state"]) => void): (() => void) => {
        if (!stateListeners.has(storeKey)) {
          stateListeners.set(storeKey, new Set());
        }
        const listeners = stateListeners.get(storeKey)!;
        listeners.add(listener);
        // Notify immediately with current state
        if (stateByStore.has(storeKey)) {
             listener(stateByStore.get(storeKey)!);
        } else if (config.initialState?.[storeKey]) {
             listener(config.initialState[storeKey]!);
        }
        return () => {
          listeners.delete(listener);
        };
      },

      // Mock dispatch only records history and notifies listeners
      dispatch: (event: TStores[K]["events"]): void => { // Dispatch is void
        if (!eventHistory.has(storeKey)) {
          eventHistory.set(storeKey, []);
        }
        eventHistory.get(storeKey)!.push(event);
        // Notify event listeners
        notifyEventListeners(storeKey, event.type, event, storeInstance);
      },

      produce: (producer: (state: TStores[K]["state"]) => void): void => {
        let currentState = stateByStore.get(storeKey) ?? config.initialState?.[storeKey]!;
        // Create a mutable copy for the producer
        const draft = { ...currentState };
        producer(draft);
        // Check if state actually changed to avoid unnecessary notifications
        if (JSON.stringify(draft) !== JSON.stringify(currentState)) {
            stateByStore.set(storeKey, draft);
            notifyStateListeners(storeKey);
        }
      },

      reset: (): void => {
        const initialStateForKey = config.initialState?.[storeKey];
        if (initialStateForKey !== undefined) {
             stateByStore.set(storeKey, initialStateForKey);
             notifyStateListeners(storeKey);
        } else {
            stateByStore.delete(storeKey);
            // Consider if stateListeners should be notified of deletion/undefined state
        }
        // Clear history on reset
        eventHistory.delete(storeKey);
      },

      setState: (state: TStores[K]["state"]): void => {
        stateByStore.set(storeKey, state);
        notifyStateListeners(storeKey);
      },

      // Implement the 'on' method for the mock store
      on: <EventType extends TStores[K]["events"]['type']>(
        eventType: EventType,
        listener: (
            event: Extract<TStores[K]["events"], { type: EventType }>,
            store: Store<TStores[K]["state"], TStores[K]["events"]> // Use base Store type here
        ) => Promise<void> | void
      ): (() => void) => {
        if (!eventListeners.has(storeKey)) {
            eventListeners.set(storeKey, new Map());
        }
        const storeEventListeners = eventListeners.get(storeKey)!;
        const eventTypeStr = eventType as string;

        if (!storeEventListeners.has(eventTypeStr)) {
            storeEventListeners.set(eventTypeStr, new Set());
        }
        const listenersForEvent = storeEventListeners.get(eventTypeStr)!;

        // Cast listener type for storage
        const typedListener = listener as (event: any, store: Store<any, any>) => Promise<void> | void;
        listenersForEvent.add(typedListener);

        return () => {
            listenersForEvent.delete(typedListener);
            // Clean up maps if sets become empty
            if (listenersForEvent.size === 0) {
                storeEventListeners.delete(eventTypeStr);
            }
            if (storeEventListeners.size === 0) {
                eventListeners.delete(storeKey);
            }
        };
      }
    };

    stores.set(storeKey, storeInstance);
    return storeInstance;
  };

  // Initialize state tracking from config
  if (config.initialState) {
    for (const [key, state] of Object.entries(config.initialState)) {
       if (state !== undefined) {
         stateByStore.set(key as keyof TStores, state);
       }
    }
  }

  // Return the MockBridge object
  return {
    isSupported: () => config.isSupported ?? true,

    // Modify getStore to check for state before creating/returning
    getStore: <K extends keyof TStores>(
      storeKey: K
    ): MockStore<TStores[K]["state"], TStores[K]["events"]> | undefined => {
      // Only return a store if we actually have tracked state for it
      if (!stateByStore.has(storeKey)) {
        return undefined;
      }
      // If state exists, get or create the mock store instance
      return getOrCreateStore(storeKey);
    },

    subscribe: (listener: () => void): (() => void) => {
      storeListeners.add(listener);
      return () => {
        storeListeners.delete(listener);
      };
    },

    getHistory: <K extends keyof TStores>(storeKey: K): TStores[K]["events"][] => {
      return (eventHistory.get(storeKey) as TStores[K]["events"][] | undefined) ?? [];
    },

    reset: (storeKey?: keyof TStores): void => {
      const storeKeysToReset = storeKey ? [storeKey] : Array.from(stores.keys());
      let availabilityChanged = false;
      storeKeysToReset.forEach(key => {
          const store = stores.get(key);
          const hadStateBefore = stateByStore.has(key);
          store?.reset(); // Calls mock store's reset which updates stateByStore
          eventHistory.delete(key);
          if (hadStateBefore && !stateByStore.has(key)) {
              availabilityChanged = true; // Became unavailable
          }
      });
      if (storeKey === undefined) { // Full reset
          eventHistory.clear();
      }
      if (availabilityChanged) {
          notifyStoreListeners();
      }
    },

    setState: <K extends keyof TStores>(
      storeKey: K,
      state: TStores[K]["state"]
    ): void => {
      const storeExisted = stateByStore.has(storeKey);
      const store = getOrCreateStore(storeKey);
      store.setState(state); // This updates stateByStore and notifies state listeners
      // Notify store listeners ONLY if the store just became available
      if (!storeExisted) {
        notifyStoreListeners();
      }
    },

    setStore: <K extends keyof TStores>(
      key: K,
      store: Store<TStores[K]["state"], TStores[K]["events"]> | undefined
    ): void => {
       const storeExisted = stateByStore.has(key);
      if (store === undefined) {
          stores.delete(key);
          stateByStore.delete(key);
          eventListeners.delete(key);
          stateListeners.delete(key);
          eventHistory.delete(key);
          if (storeExisted) {
              notifyStoreListeners(); // Notify became unavailable
          }
      } else {
          stateByStore.set(key, store.getSnapshot());
          getOrCreateStore(key); // Ensure mock store exists
          if (!storeExisted) {
              notifyStoreListeners(); // Notify became available
          }
      }
    },

    handleWebMessage: (message: string | { nativeEvent: { data: string } }) => {
      const data = typeof message === 'string' ? message : message.nativeEvent.data;
      try {
        const parsedMessage = JSON.parse(data);
        if (parsedMessage.type === 'BRIDGE_READY') {
          const webView = webViews.values().next().value;
          if (webView) {
            readyWebViews.add(webView);
            notifyReadyStateListeners();
          }
        } else if (parsedMessage.type === 'EVENT') {
          const store = stores.get(parsedMessage.storeKey as keyof TStores);
          if (store) {
            store.dispatch(parsedMessage.event);
          }
        }
      } catch (e) {
        console.warn('Failed to parse WebView message:', e);
      }
    },

    registerWebView: (webView: WebView) => {
      webViews.add(webView);
      return () => {
        webViews.delete(webView);
        readyWebViews.delete(webView);
      };
    },

    unregisterWebView: (webView: WebView) => {
      webViews.delete(webView);
      readyWebViews.delete(webView);
    },

    onWebViewReady: (callback: () => void) => {
      readyStateListeners.add(callback);
      return () => {
        readyStateListeners.delete(callback);
      };
    },

    isWebViewReady: () => readyWebViews.size > 0,
  };
} 