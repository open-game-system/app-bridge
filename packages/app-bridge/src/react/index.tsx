import React, {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore
} from "react";
import type { Bridge, BridgeStores, State } from "../types";

export function createBridgeContext<TStores extends BridgeStores>() {
  // Create a dummy bridge that throws on any method call
  const throwBridge = new Proxy({} as Bridge<TStores>, {
    get() {
      throw new Error(
        "Bridge not found in context. Did you forget to wrap your app in <BridgeContext.Provider bridge={...}>?"
      );
    },
  });

  const BridgeContext = createContext<Bridge<TStores>>(throwBridge);

  const Provider = memo(({ 
    children, 
    bridge 
  }: { 
    children: ReactNode;
    bridge: Bridge<TStores>;
  }) => {
    return (
      <BridgeContext.Provider value={bridge}>
        {children}
      </BridgeContext.Provider>
    );
  });
  Provider.displayName = "BridgeProvider";

  function useBridge(): Bridge<TStores> {
    const bridge = useContext(BridgeContext);
    return bridge;
  }

  function useSelector<K extends keyof TStores, T extends State>(
    storeKey: K,
    selector: (state: TStores[K]["state"]) => T
  ): T {
    const bridge = useBridge();
    const memoizedSelector = useMemo(() => selector, [selector]);
    
    return useSyncExternalStoreWithSelector(
      (onStoreChange) => bridge.subscribe(storeKey, onStoreChange),
      () => {
        const snapshot = bridge.getSnapshot()[storeKey];
        return snapshot !== null ? memoizedSelector(snapshot) : memoizedSelector({} as TStores[K]["state"]);
      },
      () => {
        const snapshot = bridge.getSnapshot()[storeKey];
        return snapshot !== null ? memoizedSelector(snapshot) : memoizedSelector({} as TStores[K]["state"]);
      },
      memoizedSelector,
      (a, b) => a === b
    );
  }

  function useDispatch<K extends keyof TStores>(storeKey: K) {
    const bridge = useBridge();
    return useCallback(
      (event: TStores[K]["events"]) => {
        bridge.dispatch(storeKey, event);
      },
      [bridge, storeKey]
    );
  }

  const Supported = memo(({ children }: { children: ReactNode }) => {
    const bridge = useBridge();
    const isSupported = bridge.isSupported();
    return isSupported ? <>{children}</> : null;
  });
  Supported.displayName = "BridgeSupported";

  const Unsupported = memo(({ children }: { children: ReactNode }) => {
    const bridge = useBridge();
    const isSupported = bridge.isSupported();
    return !isSupported ? <>{children}</> : null;
  });
  Unsupported.displayName = "BridgeUnsupported";

  function createStoreContext<K extends keyof TStores>(storeKey: K) {
    const StoreContext = createContext<TStores[K]["state"] | null>(null);
    
    const StoreProvider = memo(({ children }: { children: ReactNode }) => {
      const bridge = useBridge();
      
      const state = useSyncExternalStoreWithSelector(
        (onStoreChange) => {
          return bridge.subscribe(storeKey, (newState) => {
            onStoreChange();
          });
        },
        () => {
          const snapshot = bridge.getSnapshot()[storeKey];
          return snapshot;
        },
        () => {
          const snapshot = bridge.getSnapshot()[storeKey];
          return snapshot;
        },
        (state) => state,
        (a, b) => a === b
      );
      
      return (
        <StoreContext.Provider value={state}>
          {children}
        </StoreContext.Provider>
      );
    });
    StoreProvider.displayName = `StoreProvider<${String(storeKey)}>`;

    function useStore() {
      const state = useContext(StoreContext);
      return state;
    }

    function useSelector<T extends TStores[K]["state"]>(selector: (state: TStores[K]["state"]) => T): T {
      const bridge = useBridge();
      return useSyncExternalStoreWithSelector(
        (onStoreChange) => bridge.subscribe(storeKey, onStoreChange),
        () => {
          const snapshot = bridge.getSnapshot()[storeKey];
          return snapshot !== null ? selector(snapshot) : selector({} as TStores[K]["state"]);
        },
        () => {
          const snapshot = bridge.getSnapshot()[storeKey];
          return snapshot !== null ? selector(snapshot) : selector({} as TStores[K]["state"]);
        },
        selector,
        (a, b) => a === b
      );
    }

    function useDispatch() {
      const bridge = useBridge();
      return useCallback(
        (event: TStores[K]["events"]) => {
          bridge.dispatch(storeKey, event);
        },
        [bridge]
      );
    }

    const Initialized = memo(({ children }: { children: ReactNode }) => {
      const state = useStore();
      return state !== null ? <>{children}</> : null;
    });
    Initialized.displayName = `StoreInitialized<${String(storeKey)}>`;

    const Initializing = memo(({ children }: { children: ReactNode }) => {
      const state = useStore();
      return state === null ? <>{children}</> : null;
    });
    Initializing.displayName = `StoreInitializing<${String(storeKey)}>`;

    return {
      Provider: StoreProvider,
      useStore,
      useSelector,
      useDispatch,
      Initialized,
      Initializing
    };
  }

  return {
    Provider,
    useBridge,
    useSelector,
    useDispatch,
    Supported,
    Unsupported,
    createStoreContext
  };
}

function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const lastSelection = useMemo(() => ({
    value: null as Selection | null
  }), []);

  const getSelection = useCallback(() => {
    const nextSnapshot = getSnapshot();
    const nextSelection = selector(nextSnapshot);

    // If we have a previous selection and it's equal to the next selection, return the previous
    if (lastSelection.value !== null && isEqual?.(lastSelection.value, nextSelection)) {
      return lastSelection.value;
    }

    // Otherwise store and return the new selection
    lastSelection.value = nextSelection;
    return nextSelection;
  }, [getSnapshot, selector, isEqual]);

  const result = useSyncExternalStore(
    subscribe,
    getSelection,
    getServerSnapshot ? () => selector(getServerSnapshot()) : undefined
  );
  return result;
} 