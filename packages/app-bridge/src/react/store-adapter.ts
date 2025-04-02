import { Bridge, BridgeStores } from '../types';

export function createStoreAdapter<TStores extends BridgeStores, K extends keyof TStores>(
  bridge: Bridge<TStores>,
  storeKey: K
) {
  return {
    subscribe: (onStoreChange: () => void) => {
      return bridge.subscribe(storeKey, () => onStoreChange());
    },
    getSnapshot: () => bridge.getSnapshot()[storeKey],
  };
} 