import type { Bridge, BridgeStores, Store } from '../types';

/**
 * Creates a web bridge instance that communicates with the native host
 */
export function createWebBridge(): Bridge {
  return {
    isSupported: () => {
      // Check if we're running in a WebView with the native bridge
      return typeof window !== 'undefined' && 'ReactNativeWebView' in window;
    },
    getStore: async <K extends keyof BridgeStores>(key: K): Promise<Store> => {
      // Implementation will go here
      throw new Error('Not implemented');
    }
  };
} 