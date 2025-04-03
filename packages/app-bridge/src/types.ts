export interface Event {
  type: string;
}

export interface State {
  [key: string]: any;
}

export interface BridgeStores {
  [key: string]: {
    state: State;
    events: Event;
  };
}

export type BridgeState<TStores extends BridgeStores> = {
  [K in keyof TStores]: TStores[K]['state'] | null;
};

export interface Bridge<TStores extends BridgeStores> {
  isSupported: () => boolean;
  getSnapshot: () => BridgeState<TStores>;
  subscribe: <K extends keyof TStores>(storeKey: K, callback: (state: TStores[K]['state']) => void) => () => void;
  dispatch: <K extends keyof TStores>(storeKey: K, event: TStores[K]['events']) => void;
} 