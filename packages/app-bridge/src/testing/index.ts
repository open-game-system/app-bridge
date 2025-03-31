// Testing utilities will go here
import type { Bridge, BridgeStores, Store, State, Event, NativeBridge } from '../types';

interface MockBridgeConfig<T extends BridgeStores> {
  isSupported: boolean;
  stores: {
    [K in keyof T]?: {
      initialState: T[K]['initialState'];
    };
  };
}

export function createMockNativeBridge<T extends BridgeStores>(config: MockBridgeConfig<T>): NativeBridge {
  const stores = new Map<keyof T, Store<State, Event>>();

  // Initialize stores
  Object.entries(config.stores).forEach(([key, storeConfig]) => {
    if (storeConfig) {
      stores.set(key as keyof T, {
        getState: () => storeConfig.initialState as State,
        subscribe: () => () => {},
        dispatch: async () => {},
      });
    }
  });

  return {
    isSupported: () => config.isSupported,
    getStore: async (key: keyof T) => {
      const store = stores.get(key);
      if (!store) {
        throw new Error(`Store ${String(key)} not found`);
      }
      return store;
    },
    produce: async (key: keyof T, recipe: (draft: T[keyof T]['initialState']) => void) => {
      const store = stores.get(key);
      if (!store) {
        throw new Error(`Store ${String(key)} not found`);
      }
      const currentState = store.getState();
      recipe(currentState as T[keyof T]['initialState']);
    },
  };
} 