// Export RN bridge
export * from './bridge';

// Re-export from React package for convenience
export {
  BridgeContext,
  useBridge,
  useAppState,
  useAppSelector,
  useValue,
  useSetValue,
  useSelector,
  useDispatch,
  useSubscribe,
} from '@open-game-system/app-bridge-react';

// Re-export context interface type
export type {
  BridgeContextValue,
} from '@open-game-system/app-bridge-react/context';

// Re-export from core for convenience
export type {
  BridgeAction,
  BridgeMiddleware,
  BridgeOptions,
  BridgeState,
  StoreListener,
  Selector,
} from '@open-game-system/app-bridge';
