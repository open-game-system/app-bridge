// Core types and utilities
export * from './types';
export * from './web';
export * from './react';
export {
  MockBridge,
  MockBridgeConfig,
  createMockBridge
} from './testing';

// Re-export submodules for backward compatibility
import * as web from './web';
import * as react from './react';
import * as testing from './testing';

export { web, react, testing };