// Testing utilities will go here
import { produce } from 'immer';
import type { Bridge, BridgeStores } from '../types';

export interface MockBridgeConfig<TStores extends BridgeStores> {
  /**
   * Whether the bridge is supported in the current environment
   * @default true
   */
  isSupported?: boolean;

  /**
   * Store configurations. Each store can have its own state, events, and reducers.
   */
  stores?: { [K in keyof TStores]?: TStores[K]['state'] };
}

export function createMockBridge<TStores extends BridgeStores>(config: MockBridgeConfig<TStores> = {}): Bridge<TStores> {
  let state: { [K in keyof TStores]: TStores[K]['state'] | null } = {} as { [K in keyof TStores]: TStores[K]['state'] | null };
  const listeners = new Map<keyof TStores, Set<(state: TStores[keyof TStores]['state'] | null) => void>>();

  // Initialize state from config
  if (config.stores) {
    for (const [key, value] of Object.entries(config.stores)) {
      state[key as keyof TStores] = value as TStores[keyof TStores]['state'];
    }
  }

  const notifyListeners = <K extends keyof TStores>(storeKey: K) => {
    const storeListeners = listeners.get(storeKey);
    if (storeListeners) {
      storeListeners.forEach(listener => listener(state[storeKey]));
    }
  };

  return {
    isSupported: () => config.isSupported ?? true,
    
    getSnapshot: () => state,

    subscribe: <K extends keyof TStores>(storeKey: K, callback: (state: TStores[K]['state']) => void) => {
      if (!listeners.has(storeKey)) {
        listeners.set(storeKey, new Set());
      }
      const storeListeners = listeners.get(storeKey)!;
      const wrappedCallback = (state: TStores[keyof TStores]['state'] | null) => {
        if (state !== null) {
          callback(state as TStores[K]['state']);
        }
      };
      storeListeners.add(wrappedCallback);
      return () => {
        storeListeners.delete(wrappedCallback);
      };
    },

    dispatch: <K extends keyof TStores>(storeKey: K, event: TStores[K]['events']) => {
      const currentState = state[storeKey];
      if (currentState === null) return;

      // Update state based on event type
      switch (event.type) {
        case 'INCREMENT':
          state[storeKey] = produce(currentState, draft => {
            if ('value' in draft) {
              (draft as any).value += 1;
            }
          });
          break;
        case 'DECREMENT':
          state[storeKey] = produce(currentState, draft => {
            if ('value' in draft) {
              (draft as any).value -= 1;
            }
          });
          break;
        case 'SET':
          if ('value' in event) {
            state[storeKey] = produce(currentState, draft => {
              if ('value' in draft) {
                (draft as any).value = (event as any).value;
              }
            });
          }
          break;
      }

      notifyListeners(storeKey);
    },

    reset: (storeKey?: keyof TStores) => {
      if (storeKey) {
        state[storeKey] = config.stores?.[storeKey] ?? null;
        notifyListeners(storeKey);
      } else {
        // Reset all stores to their initial state from config
        for (const key in state) {
          state[key as keyof TStores] = config.stores?.[key as keyof TStores] ?? null;
          notifyListeners(key as keyof TStores);
        }
      }
    },

    produce: <K extends keyof TStores>(storeKey: K, recipe: (draft: TStores[K]['state']) => void) => {
      const currentState = state[storeKey];
      if (currentState === null) return;
      state[storeKey] = produce(currentState, recipe);
      notifyListeners(storeKey);
    },

    setState: <K extends keyof TStores>(storeKey: K, newState: TStores[K]['state'] | null) => {
      state[storeKey] = newState;
      notifyListeners(storeKey);
    }
  };
} 