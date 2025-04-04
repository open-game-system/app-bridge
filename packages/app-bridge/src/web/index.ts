import { applyPatch, Operation } from "fast-json-patch";
import { Bridge, BridgeStoreDefinitions, Store, State, Event, WebToNativeMessage, NativeToWebMessage } from "../types";

export interface WebViewBridge {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: WebViewBridge;
  }
}

/**
 * Creates a web bridge instance for use in web applications
 * This implementation receives state from the native side through WebView messages
 *
 * @template TStores Store definitions for the bridge
 * @returns A Bridge instance
 */
export function createWebBridge<TStores extends BridgeStoreDefinitions>(): Bridge<TStores> {
  // Internal state storage
  const stateByStore = new Map<keyof TStores, TStores[keyof TStores]["state"]>();
  
  // Store instances by key
  const stores = new Map<
    keyof TStores,
    Store<TStores[keyof TStores]["state"], TStores[keyof TStores]["events"]>
  >();

  // Listeners for state changes by store key
  const stateListeners = new Map<
    keyof TStores,
    Set<(state: TStores[keyof TStores]["state"]) => void>
  >();

  // Listeners for store availability changes
  const storeListeners = new Set<() => void>();

  /**
   * Notify all listeners for a specific store's state changes
   */
  const notifyStateListeners = <K extends keyof TStores>(storeKey: K) => {
    const listeners = stateListeners.get(storeKey);
    if (listeners && stateByStore.has(storeKey)) {
      const state = stateByStore.get(storeKey);
      listeners.forEach((listener) => listener(state!));
    }
  };

  /**
   * Notify all listeners that a store's availability has changed
   */
  const notifyStoreListeners = () => {
    storeListeners.forEach((listener) => listener());
  };

  // Handle messages from native
  if (typeof window !== "undefined" && window.ReactNativeWebView) {
    window.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as NativeToWebMessage;
        if (message.type === "STATE_INIT") {
          // Initialize state with full data
          stateByStore.set(message.storeKey as keyof TStores, message.data);
          notifyStateListeners(message.storeKey as keyof TStores);
          notifyStoreListeners();
        } else if (message.type === "STATE_UPDATE") {
          // Apply patch operations
          const currentState = stateByStore.get(message.storeKey as keyof TStores);
          if (currentState) {
            const result = applyPatch(
              currentState,
              message.operations
            );
            stateByStore.set(message.storeKey as keyof TStores, result.newDocument);
            notifyStateListeners(message.storeKey as keyof TStores);
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });
  }

  return {
    /**
     * Check if the bridge is supported
     * For web bridge, this checks if ReactNativeWebView is available
     */
    isSupported: () =>
      typeof window !== "undefined" && !!window.ReactNativeWebView,

    /**
     * Get a store by its key
     * Returns undefined if the store doesn't exist
     */
    getStore: <K extends keyof TStores>(
      storeKey: K
    ): Store<TStores[K]["state"], TStores[K]["events"]> | undefined => {
      // Only return a store if we have state for it
      if (!stateByStore.has(storeKey)) return undefined;

      // Return existing store instance if we have one
      let store = stores.get(storeKey) as Store<
        TStores[K]["state"],
        TStores[K]["events"]
      > | undefined;
      
      // Create a new store if needed
      if (!store) {
        store = {
          /**
           * Get the current state of the store
           */
          getSnapshot: () => stateByStore.get(storeKey)!,

          /**
           * Subscribe to state changes for this store
           * Returns an unsubscribe function
           */
          subscribe: (listener: (state: TStores[K]["state"]) => void) => {
            if (!stateListeners.has(storeKey)) {
              stateListeners.set(storeKey, new Set());
            }
            const listeners = stateListeners.get(storeKey)!;
            listeners.add(listener);

            // Notify immediately with current state
            if (stateByStore.has(storeKey)) {
              listener(stateByStore.get(storeKey)!);
            }

            return () => {
              listeners.delete(listener);
            };
          },

          /**
           * Dispatch an event to the store
           * Sends the event to the native side
           */
          dispatch: (event: TStores[K]["events"]) => {
            if (!window.ReactNativeWebView) {
              console.warn(
                "Cannot dispatch events: ReactNativeWebView not available"
              );
              return;
            }
            const message: WebToNativeMessage = {
              type: "EVENT",
              storeKey: storeKey as string,
              event,
            };
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          },
        };
        stores.set(storeKey, store);
      }
      
      return store;
    },

    /**
     * Subscribe to store availability changes
     * Returns an unsubscribe function
     */
    subscribe: (listener) => {
      storeListeners.add(listener);
      return () => {
        storeListeners.delete(listener);
      };
    },
  };
}
