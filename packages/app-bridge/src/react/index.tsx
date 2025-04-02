import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { Bridge, BridgeStores } from "../types";

// Bridge Context

export interface BridgeContextValue<TStores extends BridgeStores> extends Bridge<TStores> {}

export interface BridgeProviderProps<TStores extends BridgeStores> {
  bridge: Bridge<TStores>;
  children: React.ReactNode;
}

export function createBridgeContext<TStores extends BridgeStores>() {
  const BridgeContext = createContext<BridgeContextValue<TStores> | null>(null);

  function Provider({ bridge, children }: BridgeProviderProps<TStores>) {
    const value = useMemo(() => bridge, [bridge]);

    return (
      <BridgeContext.Provider value={value}>
        {children}
      </BridgeContext.Provider>
    );
  }

  function useBridge() {
    const context = useContext(BridgeContext);
    if (!context) {
      throw new Error('useBridge must be used within a BridgeProvider');
    }
    return context;
  }

  function useStore<K extends keyof TStores>(storeKey: K) {
    const bridge = useBridge();
    const subscribe = useCallback(
      (onStoreChange: () => void) => bridge.subscribe(storeKey, onStoreChange as any),
      [bridge, storeKey]
    );
    const getSnapshot = useCallback(
      () => bridge.getSnapshot()[storeKey],
      [bridge, storeKey]
    );
    const state = useSyncExternalStore(subscribe, getSnapshot);
    return {
      state,
      dispatch: (event: TStores[K]['events']) => bridge.dispatch(storeKey, event),
    };
  }

  function Supported({ children }: { children: React.ReactNode }) {
    const bridge = useBridge();
    return bridge.isSupported() ? <>{children}</> : null;
  }

  function Unsupported({ children }: { children: React.ReactNode }) {
    const bridge = useBridge();
    return !bridge.isSupported() ? <>{children}</> : null;
  }

  // Store Context Factory
  function createStoreContext<TKey extends keyof TStores>(storeKey: TKey) {
    type StoreState = TStores[TKey]['state'];
    type StoreEvents = TStores[TKey]['events'];

    /**
     * Hook to access the store state directly.
     * Safe to use anywhere - returns null if store not initialized.
     */
    const useStore = () => {
      const bridge = useBridge();
      const subscribe = useCallback(
        (onStoreChange: () => void) => bridge.subscribe(storeKey, onStoreChange as any),
        [bridge, storeKey]
      );
      const getSnapshot = useCallback(
        () => bridge.getSnapshot()[storeKey],
        [bridge, storeKey]
      );
      return useSyncExternalStore(subscribe, getSnapshot);
    };

    const useSelector = <T,>(selector: (state: StoreState) => T): T => {
      const bridge = useBridge();
      const subscribe = useCallback(
        (onStoreChange: () => void) => bridge.subscribe(storeKey, onStoreChange as any),
        [bridge, storeKey]
      );
      const getSnapshot = useCallback(
        () => bridge.getSnapshot()[storeKey],
        [bridge, storeKey]
      );
      const state = useSyncExternalStore(subscribe, getSnapshot);

      if (!state) {
        throw new Error('Cannot use useSelector outside of a StoreContext.Initialized component');
      }

      return selector(state);
    };

    function useDispatch() {
      const bridge = useBridge();
      const storeState = useStore();
      
      return useCallback((event: StoreEvents) => {
        if (storeState === null) {
          console.warn(`Attempted to dispatch event ${event.type} to store ${String(storeKey)} which is not initialized`);
          return;
        }
        bridge.dispatch(storeKey, event);
      }, [bridge, storeKey, storeState]);
    }

    function Initializing({ children }: { children: React.ReactNode }) {
      const storeState = useStore();
      return storeState === null ? <>{children}</> : null;
    }
    Initializing.displayName = `${String(storeKey)}StoreInitializing`;

    function Initialized({ children }: { children: React.ReactNode }) {
      const storeState = useStore();
      return storeState !== null ? <>{children}</> : null;
    }
    Initialized.displayName = `${String(storeKey)}StoreInitialized`;

    return {
      useStore,
      useSelector,
      useDispatch,
      Initializing,
      Initialized,
    };
  }

  return {
    Provider,
    useBridge,
    useStore,
    Supported,
    Unsupported,
    createStoreContext,
  };
}
