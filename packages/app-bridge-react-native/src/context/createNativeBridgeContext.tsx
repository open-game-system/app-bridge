import React, { createContext, useContext, useEffect } from 'react';
import type { BridgeStores, NativeBridge, Store } from '@open-game-system/app-bridge-types';

export interface BridgeProviderProps<TStores extends BridgeStores> {
  bridge: NativeBridge<TStores>;
  children: React.ReactNode;
}

export function createNativeBridgeContext<TStores extends BridgeStores>() {
  const NativeBridgeContext = createContext<NativeBridge<TStores> | null>(null);

  function BridgeProvider({ bridge, children }: BridgeProviderProps<TStores>) {
    return (
      <NativeBridgeContext.Provider value={bridge}>
        {children}
      </NativeBridgeContext.Provider>
    );
  }

  function useBridge(): NativeBridge<TStores> {
    const bridge = useContext(NativeBridgeContext);
    if (!bridge) {
      throw new Error('useBridge must be used within a BridgeProvider');
    }
    return bridge;
  }

  function createNativeStoreContext<TStoreName extends keyof TStores>(storeName: TStoreName) {
    function useSelector<TSelected>(
      selector: (state: TStores[TStoreName]['state']) => TSelected
    ): TSelected {
      const bridge = useBridge();
      const store = bridge.getStore(storeName);
      
      if (!store) {
        throw new Error(`Store '${String(storeName)}' is not registered with the bridge or is undefined.`);
      }

      const subscribe = React.useCallback((onStoreChange: () => void) => {
        const currentStore = bridge.getStore(storeName);
        if (currentStore) {
          return currentStore.subscribe(onStoreChange);
        }
        return () => {}; 
      }, [bridge, storeName]);

      const getSnapshot = React.useCallback(() => {
        const currentStore = bridge.getStore(storeName);
        if (currentStore) {
          return currentStore.getSnapshot();
        }
        throw new Error(`Store '${String(storeName)}' became unavailable during snapshot retrieval.`);
      }, [bridge, storeName]);

      const storeState = React.useSyncExternalStore(
        subscribe,
        getSnapshot,
        getSnapshot
      );

      try {
        return selector(storeState);
      } catch (error) {
        console.error(`Error applying selector for store '${String(storeName)}':`, error);
        throw error; 
      }
    }

    function StoreProvider({ children }: { children: React.ReactNode }) {
      const bridge = useBridge();
      const store = bridge.getStore(storeName);
      if (!store) {
        throw new Error(`Store '${String(storeName)}' is not registered with the bridge`);
      }
      const value = store.getSnapshot();

      const StoreContext = React.createContext<TStores[TStoreName]['state'] | null>(null);

      return (
        <StoreContext.Provider value={value}>
          {children}
        </StoreContext.Provider>
      );
    }

    return {
      StoreProvider,
      useSelector,
      useStore: () => {
         const bridge = useBridge();
         const store = bridge.getStore(storeName);
         if (!store) {
            throw new Error(`Store '${String(storeName)}' is not registered with the bridge`);
         }
         return store;
      }
    };
  }

  return {
    BridgeProvider,
    useBridge,
    createNativeStoreContext,
  };
} 