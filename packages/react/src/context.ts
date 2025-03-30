import { createContext, useContext } from 'react';
import { BridgeState, Selector } from '@open-game-system/app-bridge';
import type { WebBridge } from '@open-game-system/app-bridge-web';

/**
 * Context interface for the bridge
 */
export interface BridgeContextValue {
  bridge: WebBridge | null;
  state: BridgeState;
}

/**
 * Default context value
 */
const defaultContextValue: BridgeContextValue = {
  bridge: null,
  state: {},
};

/**
 * Create the React context for the bridge
 */
export const BridgeContext = createContext<BridgeContextValue>(defaultContextValue);

/**
 * Hook to access the bridge context
 */
export function useBridgeContext(): BridgeContextValue {
  return useContext(BridgeContext);
}

/**
 * Hook to access the bridge instance
 */
export function useBridge(): WebBridge {
  const { bridge } = useBridgeContext();

  if (!bridge) {
    throw new Error(
      'No bridge instance found in context. Did you forget to wrap your component with BridgeProvider?'
    );
  }

  return bridge;
}

/**
 * Hook to access the current state
 */
export function useAppState(): BridgeState {
  const { state } = useBridgeContext();
  return state;
}

/**
 * Hook to select a specific part of the state
 */
export function useAppSelector<T>(selector: Selector<T>): T {
  const state = useAppState();
  return selector(state);
}
