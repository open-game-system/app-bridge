import { createBridgeContext, createWebBridge } from "@open-game-system/app-bridge";
import type { AppStores } from "./types";

// Set up message logging for debugging
const logMessage = (source: string, message: any) => {
  console.log(`[Bridge ${source}]`, message);
};

// Create the web bridge
const webBridge = createWebBridge<AppStores>();

// Log initial state
const isBridgeSupported = typeof window !== 'undefined' && !!window.ReactNativeWebView;
logMessage('Init', {
  isSupported: isBridgeSupported,
  hasReactNativeWebView: isBridgeSupported,
  windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(k => k.includes('React')) : []
});

// Debug listener for message events
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      logMessage('Message', {
        type: data?.type,
        storeKey: data?.storeKey,
        hasData: !!data?.data,
        hasOps: Array.isArray(data?.operations),
        raw: event.data
      });
    } catch (e) {
      // Non-JSON message, ignore
    }
  });
}

// Create the bridge context
export const BridgeContext = createBridgeContext<AppStores>();
export const BridgeProvider = BridgeContext.Provider;

// Create the counter store context
export const CounterContext = BridgeContext.createStoreContext("counter");

// Subscribe to counter store updates when available
setTimeout(() => {
  const counterStore = webBridge.getStore('counter');
  if (counterStore) {
    logMessage('Store', 'Counter store is available');
    counterStore.subscribe(state => {
      logMessage('State', state);
    });
  } else {
    logMessage('Store', 'Counter store is NOT available');
  }
}, 2000);

// Export the bridge for direct access
export { webBridge };
