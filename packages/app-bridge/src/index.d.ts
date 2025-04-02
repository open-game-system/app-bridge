import type { Bridge, BridgeStores, BridgeState, State, Event } from './types';
import type { ReactNode } from 'react';

// Core types
export type { Bridge, BridgeStores, BridgeState, State, Event };

// Web module types
export interface WebViewMessage {
  type: string;
  storeKey: string;
  data: unknown;
}

export interface WebViewBridge {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: WebViewBridge;
  }
}

export function createWebBridge<TStores extends BridgeStores>(): Bridge<TStores>;

// React module types
export interface BridgeContextValue<TStores extends BridgeStores> {
  bridge: Bridge<TStores>;
  isSupported: boolean;
}

export interface BridgeProviderProps<TStores extends BridgeStores> {
  bridge: Bridge<TStores>;
  children: ReactNode;
}

export interface StoreContextValue<TState extends State, TEvent extends Event> {
  state: TState;
  dispatch: (event: TEvent) => void;
}

export function createBridgeContext<TStores extends BridgeStores>(): {
  Provider: React.FC<BridgeProviderProps<TStores>>;
  useStore: <K extends keyof TStores>(
    storeKey: K
  ) => StoreContextValue<TStores[K]['state'], TStores[K]['events']>;
  useBridge: () => BridgeContextValue<TStores>;
};

// Testing module types
export interface MockBridgeConfig<TStores extends BridgeStores> {
  isSupported?: boolean;
  stores?: {
    [K in keyof TStores]?: {
      initialState?: TStores[K]['state'];
      reducers?: {
        [E in TStores[K]['events']['type']]?: (
          state: TStores[K]['state'],
          event: Extract<TStores[K]['events'], { type: E }>
        ) => TStores[K]['state'];
      };
    };
  };
}

export function createMockBridge<TStores extends BridgeStores>(
  config?: MockBridgeConfig<TStores>
): Bridge<TStores>;

// Declare submodules
declare module '@open-game-system/app-bridge/web' {
  export { WebViewMessage, WebViewBridge, createWebBridge };
}

declare module '@open-game-system/app-bridge/react' {
  export {
    BridgeContextValue,
    BridgeProviderProps,
    StoreContextValue,
    createBridgeContext,
  };
}

declare module '@open-game-system/app-bridge/testing' {
  export { MockBridgeConfig, createMockBridge };
} 