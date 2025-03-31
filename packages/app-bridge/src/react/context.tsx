import { createContext, type ReactNode } from 'react';
import type { Bridge } from '../types';

export const BridgeContext = createContext<Bridge | null>(null);

interface BridgeProviderProps {
  bridge: Bridge;
  children: ReactNode;
}

export function BridgeProvider({ bridge, children }: BridgeProviderProps) {
  return (
    <BridgeContext.Provider value={bridge}>
      {children}
    </BridgeContext.Provider>
  );
} 