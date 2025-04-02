import type { Bridge, BridgeStores, BridgeState, State, Event } from '../types';

export interface MockBridgeConfig<TStores extends BridgeStores> {
  isSupported?: boolean;
  stores: {
    [K in keyof TStores]?: {
      initialState: TStores[K]['state'];
      reducers?: {
        [E in TStores[K]['events']['type']]: (
          state: TStores[K]['state'],
          event: Extract<TStores[K]['events'], { type: E }>
        ) => void;
      };
    };
  };
}

export function createMockBridge<TStores extends BridgeStores>(
  config: MockBridgeConfig<TStores>
): Bridge<TStores>; 