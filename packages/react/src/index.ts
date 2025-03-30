// Export context
export {
  BridgeContext,
  useBridgeContext,
  useBridge,
  useAppState,
  useAppSelector,
} from './context';

// Export hooks
export {
  useDispatch,
  useSelector,
  useValue,
  useSetValue,
  useSubscribe,
} from './hooks';

// Re-export from core for convenience
export type {
  BridgeAction,
  BridgeMiddleware,
  BridgeOptions,
  BridgeState,
  StoreListener,
  Selector,
} from '@open-game-system/app-bridge';

// Don't re-export bridges - let users import them directly
// This avoids issues with subpath exports
