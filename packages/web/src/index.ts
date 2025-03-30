// Export web-specific implementation
export { WebBridge, ClientBridge } from './bridge';

// Re-export from core for convenience
export type {
  BridgeAction,
  BridgeMiddleware,
  BridgeOptions,
  BridgeState,
  StoreListener,
  Selector,
} from '@open-game-system/app-bridge';
