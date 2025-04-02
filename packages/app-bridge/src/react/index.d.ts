import type React from 'react';
import type { Bridge, BridgeStores, State, Event } from '../types';

export interface BridgeContextValue<TStores extends BridgeStores> {
  bridge: Bridge<TStores>;
  isSupported: boolean;
}

export interface BridgeProviderProps<TStores extends BridgeStores> {
  bridge: Bridge<TStores>;
  children: React.ReactNode;
}

export interface StoreContextValue<T extends { state: State; events: Event }> {
  useStore: () => T['state'] | null;
  useSelector: <R>(selector: (state: T['state']) => R) => R | null;
  useDispatch: () => (event: T['events']) => void;
  Initialized: React.FC<{ children: React.ReactNode }>;
  Initializing: React.FC<{ children: React.ReactNode }>;
}

export function createBridgeContext<TStores extends BridgeStores>(): {
  Provider: React.FC<BridgeProviderProps<TStores>>;
  createStoreContext: <K extends keyof TStores>(
    storeKey: K
  ) => StoreContextValue<TStores[K]>;
  Supported: React.FC<{ children: React.ReactNode }>;
  Unsupported: React.FC<{ children: React.ReactNode }>;
}; 