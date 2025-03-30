// Export client-specific implementation
export * from './bridge';

// Re-export from core for convenience
export type {
  BridgeAction,
  BridgeMiddleware,
  BridgeOptions,
  BridgeState,
  StoreListener,
  Selector,
} from '@open-game-system/app-bridge';
