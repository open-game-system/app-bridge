import React, { createContext, useContext, useMemo, useCallback, useSyncExternalStore, useRef } from 'react';
import type { BridgeStores, NativeBridge, Store, State } from '@open-game-system/app-bridge-types';

export interface BridgeProviderProps<TStores extends BridgeStores> {
  bridge: NativeBridge<TStores>;
  children: React.ReactNode;
}

export function createNativeBridgeContext<TStores extends BridgeStores>() {
  // Context for the NativeBridge instance itself
  const NativeBridgeContext = createContext<NativeBridge<TStores> | null>(null);

  /**
   * Provider component that makes the native bridge instance available via context.
   */
  function BridgeProvider({ bridge, children }: BridgeProviderProps<TStores>) {
    // Memoize the value to prevent unnecessary re-renders
    const value = useMemo(() => bridge, [bridge]);
    return (
      <NativeBridgeContext.Provider value={value}>
        {children}
      </NativeBridgeContext.Provider>
    );
  }

  /**
   * Hook to access the native bridge instance.
   * Must be used within a BridgeProvider.
   */
  function useBridge(): NativeBridge<TStores> {
    const bridge = useContext(NativeBridgeContext);
    if (!bridge) {
      throw new Error('useBridge must be used within a BridgeProvider');
    }
    return bridge;
  }

  /**
   * Creates hooks for accessing a specific store registered on the native bridge.
   * @param storeName The key of the store.
   * @returns An object containing `useStore` and `useSelector` hooks for the specified store.
   */
  function createNativeStoreContext<TStoreName extends keyof TStores>(
    storeName: TStoreName
  ) {
    type CurrentStore = Store<TStores[TStoreName]['state'], TStores[TStoreName]['events']>;
    type CurrentState = TStores[TStoreName]['state'];

    // Create a context specific to this store instance
    const StoreContext = createContext<CurrentStore | null>(null);
    StoreContext.displayName = `StoreContext<${String(storeName)}>`;

    /**
     * Provider that subscribes to store availability on the bridge.
     * Renders children and provides the store context only when the store exists.
     */
    function StoreProvider({ children }: { children: React.ReactNode }) {
      const bridge = useBridge();

      // Subscribe to general bridge changes (including store registration/unregistration)
      const subscribe = useCallback(
        (callback: () => void) => {
          return bridge.subscribe(callback); 
        },
        [bridge]
      );

      // Get the current store instance (or null if not registered)
      const getStoreInstance = useCallback(() => {
        return bridge.getStore(storeName) ?? null;
      }, [bridge]);

      // Use useSyncExternalStore to get the store instance reactively
      const store = useSyncExternalStore(
        subscribe,
        getStoreInstance,
        getStoreInstance // Assume server snapshot is same as client for native
      );

      // Only render children and provide context if the store currently exists
      if (!store) {
        return null; 
      }

      return (
        <StoreContext.Provider value={store}>
          {children}
        </StoreContext.Provider>
      );
    }
    StoreProvider.displayName = `StoreProvider<${String(storeName)}>`;

    /**
     * Hook to access the specific store instance from context.
     * Must be used within the corresponding StoreProvider.
     */
    function useStore(): CurrentStore {
      const store = useContext(StoreContext);
      if (!store) {
        throw new Error(`useStore for '${String(storeName)}' must be used within its StoreProvider, and the store must be registered.`);
      }
      return store;
    }

    // Default comparison function
    function defaultCompare<T>(a: T, b: T) {
      return a === b;
    }

    /**
     * Hook to select data from the store and subscribe to updates.
     * Must be used within the corresponding StoreProvider.
     * @param selector Function to select data from the store state.
     */
    function useSelector<TSelected>(
      selector: (state: CurrentState) => TSelected,
      // Optional comparison function
      isEqual: (a: TSelected, b: TSelected) => boolean = defaultCompare
    ): TSelected {
      const store = useStore(); // Gets store from context, ensuring StoreProvider is used and store exists
      
      // Keep track of the last snapshot and selection
      const lastSnapshotRef = useRef<CurrentState | null>(null);
      const lastSelectionRef = useRef<TSelected | null>(null);

      const subscribeToStore = useCallback(
        (onStoreChange: () => void) => {
          return store.subscribe(onStoreChange);
        },
        [store]
      );

      // This function now acts like the `getSelection` in the example
      const getSelectionFromSnapshot = useCallback(() => {
        const nextSnapshot = store.getSnapshot();
        
        // If snapshot hasn't changed, reuse last selection
        if (lastSnapshotRef.current !== null && nextSnapshot === lastSnapshotRef.current) {
          // Ensure lastSelectionRef.current is not null before returning
          if (lastSelectionRef.current !== null) {
             return lastSelectionRef.current;
          }
          // If lastSelectionRef is null but snapshot is same, recalculate (should be rare)
        }
        
        // Snapshot changed or first run, calculate new selection
        const nextSelection = selector(nextSnapshot);

        // If we have a previous selection and it's equal to the next selection, return the previous reference
        if (lastSelectionRef.current !== null && isEqual(lastSelectionRef.current, nextSelection)) {
          return lastSelectionRef.current;
        }

        // Otherwise store and return the new selection and snapshot
        lastSnapshotRef.current = nextSnapshot;
        lastSelectionRef.current = nextSelection;
        return nextSelection;
      }, [store, selector, isEqual]); // Include isEqual in dependencies
      
      // Server snapshot simply applies the selector to the initial/server state
      const getServerSnapshot = useCallback(() => {
          return selector(store.getSnapshot());
      }, [store, selector]);

      // Use the enhanced getter function with useSyncExternalStore
      return useSyncExternalStore(
        subscribeToStore,
        getSelectionFromSnapshot,
        getServerSnapshot 
      );
    }

    return {
      StoreProvider, // Export the provider
      useSelector,
      useStore,
    };
  }

  return {
    BridgeProvider,
    useBridge,
    createNativeStoreContext,
  };
} 