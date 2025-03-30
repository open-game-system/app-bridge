import { BridgeAction, BridgeState, Selector } from '@open-game-system/app-bridge';
import { useCallback, useEffect, useState } from 'react';
import { useAppState, useBridge } from './context';

/**
 * Hook to use a value from the bridge state
 */
export function useValue<T>(key: string): T | undefined {
  const _bridge = useBridge();
  const state = useAppState();

  return state[key] as T | undefined;
}

/**
 * Hook to set a value in the bridge state
 */
export function useSetValue<T>(): (key: string, value: T) => void {
  const bridge = useBridge();

  return useCallback(
    (key: string, value: T) => {
      bridge.setValue(key, value);
    },
    [bridge]
  );
}

/**
 * Hook to use a selector with the bridge state
 */
export function useSelector<T>(selector: Selector<T>): T {
  const bridge = useBridge();
  const [selectedValue, setSelectedValue] = useState<T>(selector(bridge.getState()));

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = bridge.subscribe((state: BridgeState) => {
      const newSelectedValue = selector(state);
      setSelectedValue(newSelectedValue);
    });

    // Return cleanup function
    return unsubscribe;
  }, [bridge, selector]);

  return selectedValue;
}

/**
 * Hook to dispatch actions to the bridge
 */
export function useDispatch() {
  const bridge = useBridge();

  return useCallback(
    (action: BridgeAction) => {
      bridge.dispatch(action);
    },
    [bridge]
  );
}

/**
 * Hook that subscribes to state changes
 */
export function useSubscribe(callback: (state: BridgeState) => void) {
  const bridge = useBridge();

  useEffect(() => {
    const unsubscribe = bridge.subscribe(callback);
    return unsubscribe;
  }, [bridge, callback]);
}
