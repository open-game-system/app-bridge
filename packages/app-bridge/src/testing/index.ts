// Testing utilities will go here
import type { Bridge, BridgeStores } from "../types";

export interface MockBridgeConfig<TStores extends BridgeStores> {
  /**
   * Whether the bridge is supported in the current environment
   * @default true
   */
  isSupported?: boolean;

  /**
   * Store configurations. Each store can have its own state, events, and reducers.
   */
  stores: {
    [K in keyof TStores]: TStores[K]["state"];
  };
}

export function createMockBridge<TStores extends BridgeStores>(
  config: MockBridgeConfig<TStores>
): Bridge<TStores> & {
  reset: (storeKey?: keyof TStores) => void;
} {
  const state: { [K in keyof TStores]: TStores[K]["state"] | null } = {
    ...config.stores,
  };
  const listeners = new Map<keyof TStores, Set<(state: any) => void>>();

  const notifyListeners = <K extends keyof TStores>(storeKey: K) => {
    const storeListeners = listeners.get(storeKey);
    if (storeListeners) {
      storeListeners.forEach((listener) => listener(state[storeKey]));
    }
  };

  const bridge = {
    isSupported: () => config.isSupported ?? true,

    getSnapshot: () => {
      const snapshot: { [K in keyof TStores]: TStores[K]["state"] | null } =
        {} as any;
      for (const key in state) {
        snapshot[key] = state[key];
      }
      return snapshot;
    },

    subscribe: <K extends keyof TStores>(
      storeKey: K,
      callback: (state: TStores[K]["state"]) => void
    ) => {
      if (!listeners.has(storeKey)) {
        listeners.set(storeKey, new Set());
      }
      const storeListeners = listeners.get(storeKey)!;
      storeListeners.add(callback);
      if (state[storeKey] !== null) {
        callback(state[storeKey]!);
      }

      return () => {
        storeListeners.delete(callback);
        if (storeListeners.size === 0) {
          listeners.delete(storeKey);
        }
      };
    },

    dispatch: <K extends keyof TStores>(
      storeKey: K,
      event: TStores[K]["events"]
    ) => {
      if (state[storeKey] === null) return;

      // In the mock bridge, we'll just increment/decrement for INCREMENT/DECREMENT events
      // and set the value for SET events
      if (event.type === "INCREMENT") {
        state[storeKey] = {
          ...state[storeKey]!,
          value: (state[storeKey] as any).value + 1,
        };
      } else if (event.type === "DECREMENT") {
        state[storeKey] = {
          ...state[storeKey]!,
          value: (state[storeKey] as any).value - 1,
        };
      } else if (event.type === "SET") {
        state[storeKey] = { ...state[storeKey]!, value: (event as any).value };
      }
      notifyListeners(storeKey);
    },

    reset: (storeKey?: keyof TStores) => {
      console.log('MockBridge.reset called with storeKey:', storeKey);
      console.log('Current state before reset:', JSON.stringify(state));
      
      if (storeKey) {
        console.log(`Resetting store: ${String(storeKey)}`);
        state[storeKey] = { ...config.stores[storeKey] };
        console.log(`State after reset for ${String(storeKey)}:`, JSON.stringify(state[storeKey]));
        notifyListeners(storeKey);
      } else {
        // Reset all stores
        console.log('Resetting all stores');
        for (const key in config.stores) {
          state[key as keyof TStores] = { ...config.stores[key as keyof TStores] };
          console.log(`State after reset for ${String(key)}:`, JSON.stringify(state[key as keyof TStores]));
          notifyListeners(key as keyof TStores);
        }
      }
      
      console.log('Final state after reset:', JSON.stringify(state));
    },
  };

  return bridge;
}
