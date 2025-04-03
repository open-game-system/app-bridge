import type { Bridge, BridgeStores } from '../types';
import { produce } from 'immer';
import { compare, applyPatch } from 'fast-json-patch';

export interface WebView {
  injectJavaScript: (script: string) => void;
  onMessage?: (event: { data: string }) => void;
}

export interface NativeBridgeConfig<TStores extends BridgeStores> {
  initialState?: { [K in keyof TStores]: TStores[K]['state'] | null };
}

export function createNativeBridge<TStores extends BridgeStores>(
  config: NativeBridgeConfig<TStores> = {}
): Bridge<TStores> & {
  registerWebView: (webView: WebView) => void;
  unregisterWebView: (webView: WebView) => void;
  produce: <K extends keyof TStores>(storeKey: K, producer: (draft: TStores[K]['state']) => void) => void;
  setState: <K extends keyof TStores>(key: K, newState: TStores[K]['state'] | null) => void;
  reset: (storeKey?: keyof TStores) => void;
} {
  // Create a deep copy of the initial state to avoid reference issues
  const initialState = config.initialState ? JSON.parse(JSON.stringify(config.initialState)) : {} as any;
  let state: { [K in keyof TStores]: TStores[K]['state'] | null } = JSON.parse(JSON.stringify(initialState));
  const listeners = new Map<keyof TStores, Set<(state: any) => void>>();
  const webViews = new Set<WebView>();

  const notifyListeners = <K extends keyof TStores>(storeKey: K) => {
    const storeListeners = listeners.get(storeKey);
    if (storeListeners) {
      storeListeners.forEach(listener => listener(state[storeKey]));
    }
  };

  const broadcastToWebViews = (message: any) => {
    webViews.forEach(webView => {
      webView.injectJavaScript(`
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify(message)}
        }));
      `);
    });
  };

  return {
    isSupported: () => true,

    getSnapshot: () => state,

    subscribe: <K extends keyof TStores>(storeKey: K, callback: (state: TStores[K]['state']) => void) => {
      if (!listeners.has(storeKey)) {
        listeners.set(storeKey, new Set());
      }
      const storeListeners = listeners.get(storeKey)!;
      storeListeners.add(callback);
      return () => {
        storeListeners.delete(callback);
      };
    },

    dispatch: <K extends keyof TStores>(storeKey: K, event: TStores[K]['events']) => {
      // Handle events and update state as needed
      notifyListeners(storeKey);
    },

    produce: <K extends keyof TStores>(storeKey: K, producer: (draft: TStores[K]['state']) => void) => {
      const snapshot = state[storeKey];
      if (snapshot === null) return;
      const newState = produce(snapshot, producer) as TStores[K]['state'];
      
      // Calculate patch operations
      const operations = compare(snapshot, newState);
      
      if (operations.length > 0) {
        state[storeKey] = newState;
        
        // Send patch operations to web views
        broadcastToWebViews({
          type: 'STATE_UPDATE',
          storeKey: storeKey as string,
          operations,
        });
      }
      
      notifyListeners(storeKey);
    },

    setState: <K extends keyof TStores>(key: K, newState: TStores[K]['state'] | null) => {
      state[key] = newState;
      notifyListeners(key);
    },

    reset: (storeKey?: keyof TStores) => {
      if (storeKey) {
        // Get the initial state for this store
        const storeInitialState = initialState[storeKey];
        if (storeInitialState === undefined) {
          console.warn(`No initial state found for store: ${String(storeKey)}`);
          return;
        }
        
        // Reset to initial state (already a deep copy)
        state[storeKey] = JSON.parse(JSON.stringify(storeInitialState));
        
        // Send reset message to web views
        broadcastToWebViews({
          type: 'STATE_RESET',
          storeKey: storeKey as string,
          state: state[storeKey],
        });
        
        notifyListeners(storeKey);
      } else {
        // Reset all stores to their initial state
        if (!initialState || Object.keys(initialState).length === 0) {
          console.warn('No initial state found for any stores');
          return;
        }
        
        // Reset to initial state (already a deep copy)
        state = JSON.parse(JSON.stringify(initialState));
        
        // Send reset messages for all stores
        Object.keys(state).forEach(key => {
          broadcastToWebViews({
            type: 'STATE_RESET',
            storeKey: key,
            state: state[key],
          });
          notifyListeners(key as keyof TStores);
        });
      }
    },

    registerWebView: (webView: WebView) => {
      webViews.add(webView);
      if (webView.onMessage) {
        webView.onMessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'EVENT') {
              // Handle events from web view
              notifyListeners(message.storeKey as keyof TStores);
            }
          } catch (error) {
            console.error('Error handling message:', error);
          }
        };
      }
    },

    unregisterWebView: (webView: WebView) => {
      webViews.delete(webView);
    },
  };
}
