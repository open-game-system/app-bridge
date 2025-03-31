// React integration will go here
export {};

import { useContext } from 'react';
import type { Bridge } from '../types';
import { BridgeContext, BridgeProvider } from './context';

/**
 * Hook to access the bridge instance
 */
export function useBridge(): Bridge {
  const bridge = useContext(BridgeContext);
  if (!bridge) {
    throw new Error('useBridge must be used within a BridgeProvider');
  }
  return bridge;
}

export { BridgeProvider }; 