import { createBridgeContext, createWebBridge, BridgeStores } from '@open-game-system/app-bridge';

export interface CounterState {
  value: number;
}

export interface CounterEvents {
  type: 'INCREMENT' | 'DECREMENT' | 'SET';
  value?: number;
}

export interface AppStores extends BridgeStores {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
}

export const bridge = createWebBridge<AppStores>();
export const BridgeContext = createBridgeContext<AppStores>();
export const { Provider, useStore, Supported, Unsupported } = BridgeContext; 