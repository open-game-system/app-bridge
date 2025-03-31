import { produce } from 'immer';

export interface Store<State, Event> {
  getState(): State;
  dispatch(event: Event): void;
  subscribe(listener: (state: State) => void): () => void;
}

export type StoreDefinition<State = any, Event = any> = {
  state: State;
  events: Event;
};

export interface BridgeConfig {
  debug?: boolean;
}

export interface Bridge<TStores extends Record<string, { state: any; events: any }>> {
  isSupported(): boolean;
  getStore<K extends keyof TStores>(
    key: K
  ): Promise<Store<TStores[K]['state'], TStores[K]['events']>>;
}

export interface NativeBridge<TStores extends Record<string, { state: any; events: any }>>
  extends Bridge<TStores> {
  produce<K extends keyof TStores>(key: K, producer: (draft: TStores[K]['state']) => void): void;
}

interface NativeBridgeConfig<TStores extends Record<string, { state: any; events: any }>> {
  stores: {
    [K in keyof TStores]: {
      initialState: TStores[K]['state'];
      reducers: Record<string, (state: TStores[K]['state'], payload: any) => void>;
    };
  };
}

export const createNativeBridge = <TStores extends Record<string, { state: any; events: any }>>(
  config: NativeBridgeConfig<TStores>
): NativeBridge<TStores> => {
  const stores = new Map<keyof TStores, Store<any, any>>();

  // Create stores for each configuration
  for (const [key, storeConfig] of Object.entries(config.stores)) {
    let state = storeConfig.initialState;
    const listeners = new Set<(state: any) => void>();

    stores.set(key, {
      getState: () => state,
      dispatch: (event: any) => {
        const reducer = storeConfig.reducers[event.type];
        if (reducer) {
          state = produce(state, (draft: any) => {
            reducer(draft, event.payload);
          });
          listeners.forEach(listener => listener(state));
        }
      },
      subscribe: (listener: (state: any) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    });
  }

  return {
    isSupported: () => true,
    getStore: async <K extends keyof TStores>(key: K) => {
      const store = stores.get(key);
      if (!store) {
        throw new Error(`Store "${String(key)}" not found`);
      }
      return store as Store<TStores[K]['state'], TStores[K]['events']>;
    },
    produce: <K extends keyof TStores>(key: K, producer: (draft: TStores[K]['state']) => void) => {
      const store = stores.get(key);
      if (!store) {
        throw new Error(`Store "${String(key)}" not found`);
      }
      const currentState = store.getState();
      const newState = produce(currentState, producer);
      store.dispatch({ type: '__PRODUCE__', payload: newState });
    }
  };
};
