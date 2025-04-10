import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type {
  BridgeStores,
  Store,
  Bridge,
} from "@open-game-system/app-bridge-types";

interface BridgeContextValue<TStores extends BridgeStores> {
  bridge: Bridge<TStores>;
}

export function createBridgeContext<TStores extends BridgeStores>() {
  // Create a dummy bridge that throws on any method call
  const throwBridge = new Proxy({} as Bridge<TStores>, {
    get() {
      throw new Error(
        "Bridge not found in context. Did you forget to wrap your app in <BridgeContext.Provider bridge={...}>?"
      );
    },
  });

  const BridgeContext = createContext<BridgeContextValue<TStores>>({
    bridge: throwBridge,
  });

  const Provider = memo(
    ({
      children,
      bridge,
    }: {
      children: ReactNode;
      bridge: Bridge<TStores>;
    }) => {
      const value = useMemo(() => ({ bridge }), [bridge]);

      return (
        <BridgeContext.Provider value={value}>
          {children}
        </BridgeContext.Provider>
      );
    }
  );
  Provider.displayName = "BridgeProvider";

  /**
   * Internal hook to access the bridge instance
   * @returns The bridge instance
   * @internal
   */
  function useBridge(): Bridge<TStores> {
    const context = useContext(BridgeContext);
    return context.bridge;
  }

  /**
   * Create a set of hooks and components for interacting with a specific store
   * @param storeKey The key of the store to interact with
   * @returns A set of hooks and components for the specific store
   */
  function createStoreContext<K extends keyof TStores>(storeKey: K) {
    type StoreType = Store<TStores[K]["state"], TStores[K]["events"]>;
    type StoreState = TStores[K]["state"];
    
    // Create a dummy store that throws on any method call
    const throwStore = new Proxy({} as StoreType, {
      get() {
        throw new Error(
          `Store "${String(storeKey)}" is not available. Make sure to use the store hooks inside a StoreContext.Provider.`
        );
      },
    });
    
    // Create a context with a throw store as default - this ensures type safety
    // while still throwing helpful errors when accessed outside a provider
    const StoreContext = createContext<StoreType>(throwStore);
    StoreContext.displayName = `Store<${String(storeKey)}>`;

    /**
     * Provider component that automatically subscribes to store availability 
     * and provides the store when it becomes available
     */
    const Provider = memo(({ children }: { children: ReactNode }) => {
      const bridge = useBridge();
      
      // Subscribe to store availability
      const getStore = useCallback(() => {
        return bridge.getStore(storeKey) || null;
      }, [bridge]);
      
      // Subscribe to changes in store availability
      const subscribe = useCallback((callback: () => void) => {
        return bridge.subscribe(callback);
      }, [bridge]);
      
      // Use sync external store to track store availability
      const store = useSyncExternalStore(
        subscribe,
        getStore,
        getStore // Same for server
      );
      
      // Only render children if store is available
      if (!store) return null;
      
      return (
        <StoreContext.Provider value={store}>
          {children}
        </StoreContext.Provider>
      );
    });
    Provider.displayName = `Store.Provider<${String(storeKey)}>`;

    /**
     * Loading component that renders children only when the bridge is supported 
     * but the store is not yet available
     */
    const Loading = memo(({ children }: { children: ReactNode }) => {
      const bridge = useBridge();
      
      // Check if bridge is supported - this is a static property that won't change
      const isSupported = bridge.isSupported();
      
      // Subscribe to store availability
      const getStoreAvailability = useCallback(() => {
        return bridge.getStore(storeKey);
      }, [bridge]);
      
      // Subscribe to changes in store availability
      const subscribe = useCallback((callback: () => void) => {
        return bridge.subscribe(callback);
      }, [bridge]);
      
      // Use sync external store to track store availability
      const store = useSyncExternalStore(
        subscribe,
        getStoreAvailability,
        getStoreAvailability // Same for server
      );
      
      // Only render children if bridge is supported but store is not available
      return isSupported && !store ? <>{children}</> : null;
    });
    Loading.displayName = `Store.Loading<${String(storeKey)}>`;

    /**
     * Hook to access the store.
     * Must be used inside a Store.Provider component.
     * @throws Error if used outside of Store.Provider
     * @returns The store instance
     */
    function useStore(): StoreType {
      return useContext(StoreContext);
    }

    /**
     * Hook to select data from the store.
     * Must be used inside a Store.Provider component.
     * @param selector Function to select data from the store state
     * @returns The selected data from the store
     * @throws Error if used outside of Store.Provider
     */
    function useSelector<T>(selector: (state: StoreState | undefined) => T): T {
      const store = useStore();
      const memoizedSelector = useMemo(() => selector, [selector]);
      
      return useSyncExternalStore(
        store.subscribe,
        () => memoizedSelector(store.getSnapshot()),
        () => memoizedSelector(store.getSnapshot()) // Same for server
      );
    }

    return {
      Provider,
      Loading,
      useStore,
      useSelector,
    };
  }

  /**
   * Renders children only when the bridge is supported
   */
  const Supported = memo(({ children }: { children: ReactNode }) => {
    const bridge = useBridge();
    const isSupported = bridge.isSupported();
    return isSupported ? <>{children}</> : null;
  });
  Supported.displayName = "BridgeSupported";

  /**
   * Renders children only when the bridge is not supported
   */
  const Unsupported = memo(({ children }: { children: ReactNode }) => {
    const bridge = useBridge();
    const isSupported = bridge.isSupported();
    return !isSupported ? <>{children}</> : null;
  });
  Unsupported.displayName = "BridgeUnsupported";

  return {
    Provider,
    createStoreContext,
    Supported,
    Unsupported,
  };
} 