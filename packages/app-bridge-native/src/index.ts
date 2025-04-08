import { compare } from "fast-json-patch";
import { produce } from "immer";
import type {
  BridgeStores,
  Store,
  Bridge,
  WebView as BridgeWebView,
  State,
  Event,
  WebToNativeMessage,
  NativeToWebMessage
} from "@open-game-system/app-bridge-types";

// Use the BridgeWebView interface from the types file
export type WebView = BridgeWebView;

// Define the native-specific bridge interface
export interface NativeBridge<TStores extends BridgeStores> extends Bridge<TStores> {
  /**
   * Produce a new state for a store using an immer-style recipe
   */
  produce: <K extends keyof TStores>(
    storeKey: K,
    producer: (draft: TStores[K]["state"]) => void
  ) => void;

  /**
   * Set the state of a store directly
   */
  setState: <K extends keyof TStores>(
    key: K,
    newState: TStores[K]["state"] | undefined
  ) => void;

  /**
   * Process a message received from the WebView
   */
  handleWebMessage: (message: string | { nativeEvent: { data: string } }) => void;

  /**
   * Register a WebView to receive state updates
   */
  registerWebView: (webView: WebView) => () => void;

  /**
   * Unregister a WebView from receiving state updates
   */
  unregisterWebView: (webView: WebView) => void;

  /**
   * Reset a store or all stores to their initial state
   */
  reset: (storeKey?: keyof TStores) => void;

  /**
   * Subscribe to WebView ready state changes
   * Returns an unsubscribe function
   */
  onWebViewReady: (callback: () => void) => () => void;

  /**
   * Check if any WebView is ready
   */
  isWebViewReady: () => boolean;
}

// Define a better interface for the native bridge configuration
// This ensures the producers properly type-check against their stores
interface NativeBridgeConfig<TStores extends BridgeStores> {
  initialState?: { [K in keyof TStores]?: TStores[K]["state"] };
  producers?: {
    [K in keyof TStores]?: (
      draft: TStores[K]["state"], 
      event: TStores[K]["events"]
    ) => void 
  };
}

// Define the store interface with produce method
interface NativeStore<TState extends State, TEvent extends Event> extends Store<TState, TEvent> {
  produce: (producer: (draft: TState) => void) => void;
}

export function createNativeBridge<TStores extends BridgeStores>(
  config: NativeBridgeConfig<TStores> = {}
): NativeBridge<TStores> {
  // Create a deep copy of the initial state to avoid reference issues
  const initialState = config.initialState
    ? JSON.parse(JSON.stringify(config.initialState))
    : ({} as any);
  let state: { [K in keyof TStores]?: TStores[K]["state"] } = JSON.parse(
    JSON.stringify(initialState)
  );
  const listeners = new Map<keyof TStores, Set<(state: any) => void>>();
  const webViews = new Set<WebView>();
  const originalOnMessageHandlers = new WeakMap<
    WebView,
    WebView["onMessage"]
  >();
  const messageHandlers = new WeakMap<WebView, WebView["onMessage"]>();
  const producers = config.producers || {};
  const readyListeners = new Set<() => void>();
  let isReady = false;

  const notifyListeners = <K extends keyof TStores>(storeKey: K) => {
    const storeListeners = listeners.get(storeKey);
    if (storeListeners) {
      storeListeners.forEach((listener) => listener(state[storeKey]));
    }
  };

  const broadcastToWebViews = (message: any) => {
    const messageString = JSON.stringify(message);

    webViews.forEach((webView) => {
      // Use postMessage for communication
      webView.postMessage(messageString);
    });
  };

  const notifyReadyListeners = () => {
    readyListeners.forEach((listener) => listener());
  };

  /**
   * Process a message received from a WebView
   * This internal function handles the actual message processing logic
   */
  const processWebViewMessage = (data: string): void => {
    let parsedData: WebToNativeMessage;

    try {
      parsedData = JSON.parse(data);
      console.log("[Native Bridge] Received message from WebView:", parsedData);
    } catch (e) {
      console.warn("[Native Bridge] Failed to parse message from WebView:", data, e);
      return;
    }

    // Type check to ensure parsedData has a valid type
    if (!parsedData || typeof parsedData !== 'object' || !('type' in parsedData)) {
      console.warn("[Native Bridge] Invalid message format from WebView:", parsedData);
      return;
    }

    switch (parsedData.type as WebToNativeMessage['type']) {
      case "BRIDGE_READY": {
        // Mark bridge as ready
        console.log("[Native Bridge] BRIDGE_READY message received. Setting isReady to true.")
        isReady = true;
        notifyReadyListeners();

        // Send initial state for all stores
        Object.entries(state).forEach(([key, value]) => {
          if (value !== undefined) {
            broadcastToWebViews({
              type: "STATE_INIT",
              storeKey: key,
              data: value,
            });
          }
        });
        break;
      }
      case "EVENT": {
        if (parsedData.type !== "EVENT") break; // This helps TypeScript narrow the type
        // Get the store key and event from the message
        const { storeKey, event } = parsedData;

        // Dispatch the event to the appropriate store
        if (storeKey && event) {
          const typedStoreKey = storeKey as keyof TStores;
          const typedEvent = event as TStores[typeof typedStoreKey]["events"];

          // Check if we have a producer for this store
          const producer = producers[typedStoreKey as keyof typeof producers] as ((
              draft: TStores[typeof typedStoreKey]["state"],
              event: TStores[typeof typedStoreKey]["events"]
            ) => void) | undefined;

          if (producer) {
            // Use the store-specific producer to handle the event
            bridge.produce(typedStoreKey, (draft) => {
              producer(draft, typedEvent);
            });
          } else {
            // No producer found for this store, just notify listeners
            console.warn(
              `No producer found for store ${String(
                typedStoreKey
              )}, event: ${JSON.stringify(event)}`
            );
            notifyListeners(typedStoreKey);
          }
        }
        break;
      }
    }
  };

  /**
   * Create a message handler that preserves the original handler
   */
  const createMessageHandler = (
    webView: WebView,
    originalHandler?: WebView["onMessage"]
  ) => {
    return (event: { nativeEvent: { data: string } }) => {
      // Always call the original handler first if it exists
      if (originalHandler) {
        originalHandler(event);
      }

      try {
        // Extract the data from the native event
        const data = event.nativeEvent.data;
        processWebViewMessage(data);
      } catch (error) {
        console.error("[Native Bridge] Error handling message:", error);
      }
    };
  };

  // Create a self-reference for use in the event handlers
  const bridge = {} as NativeBridge<TStores>;

  Object.assign(bridge, {
    isSupported: () => true,

    getStore: <K extends keyof TStores>(
      storeKey: K
    ): NativeStore<TStores[K]["state"], TStores[K]["events"]> | undefined => {
      if (state[storeKey] === undefined) return undefined;

      return {
        getSnapshot: () => state[storeKey] as TStores[K]["state"],
        subscribe: (callback: (state: TStores[K]["state"]) => void) => {
          if (!listeners.has(storeKey)) {
            listeners.set(storeKey, new Set());
          }
          const storeListeners = listeners.get(storeKey)!;
          storeListeners.add(callback);
          return () => {
            storeListeners.delete(callback);
          };
        },
        dispatch: (event: TStores[K]["events"]) => {
          // This is mainly for internal use but we expose it for consistency
          // Native apps should use produce rather than dispatch
        },
        produce: (producer: (draft: TStores[K]["state"]) => void) => {
          bridge.produce(storeKey, producer);
        },
      };
    },

    subscribe: (listener: () => void) => {
      // Create a Set to store global listeners if it doesn't exist
      if (!listeners.has("__global__" as keyof TStores)) {
        listeners.set("__global__" as keyof TStores, new Set());
      }
      const globalListeners = listeners.get("__global__" as keyof TStores)!;
      globalListeners.add(listener as any);
      return () => {
        globalListeners.delete(listener as any);
      };
    },

    produce: <K extends keyof TStores>(
      storeKey: K,
      producer: (draft: TStores[K]["state"]) => void
    ) => {
      const currentState = state[storeKey];
      if (currentState === undefined) return;
      const newState = produce(currentState, producer) as TStores[K]["state"];

      // Calculate patch operations
      const operations = compare(currentState, newState);

      if (operations.length > 0) {
        state[storeKey] = newState;

        // Send patch operations to web views
        broadcastToWebViews({
          type: "STATE_UPDATE",
          storeKey: storeKey as string,
          operations,
        });
      }

      notifyListeners(storeKey);
    },

    setState: <K extends keyof TStores>(
      key: K,
      newState: TStores[K]["state"] | undefined
    ) => {
      state[key] = newState;

      if (newState !== undefined) {
        // Calculate patch operations for the update
        const operations = compare({}, newState);

        // Send patch operations to web views
        broadcastToWebViews({
          type: "STATE_UPDATE",
          storeKey: key as string,
          operations,
        });
      }

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

        if (state[storeKey] !== undefined) {
          // Send patch operations for the reset
          const operations = compare({}, state[storeKey]!);
          broadcastToWebViews({
            type: "STATE_UPDATE",
            storeKey: storeKey as string,
            operations,
          });
        }

        notifyListeners(storeKey);
      } else {
        // Reset all stores to their initial state
        if (!initialState || Object.keys(initialState).length === 0) {
          console.warn("No initial state found for any stores");
          return;
        }

        // Reset to initial state (already a deep copy)
        state = JSON.parse(JSON.stringify(initialState));

        // Send patch operations for all stores
        Object.keys(state).forEach((key) => {
          if (state[key] !== undefined) {
            const operations = compare({}, state[key]!);
            broadcastToWebViews({
              type: "STATE_UPDATE",
              storeKey: key,
              operations,
            });
            notifyListeners(key as keyof TStores);
          }
        });
      }
    },

    handleWebMessage: (message: string | { nativeEvent: { data: string } }) => {
      try {
        // Handle both direct message strings and event objects
        const messageData = typeof message === 'string' 
          ? message 
          : message.nativeEvent.data;
          
        processWebViewMessage(messageData);
      } catch (error) {
        console.error("[Native Bridge] Error processing WebView message:", error);
      }
    },

    registerWebView: (webView: WebView) => {
      // Verify the WebView has a postMessage method
      console.log(`[Native Bridge] Registering WebView...`, webView);
      if (!webView.postMessage) {
        console.error(
          "[Native Bridge] WebView does not have a postMessage method. Communication will not work."
        );
        return () => {}; // Return no-op function if WebView doesn't support postMessage
      }

      // Store the original onMessage handler if it exists
      const originalOnMessage = webView.onMessage;
      if (originalOnMessage) {
        originalOnMessageHandlers.set(webView, originalOnMessage);
      }

      // Set up a new handler that preserves the original
      const newHandler = createMessageHandler(webView, originalOnMessage);
      webView.onMessage = newHandler;
      messageHandlers.set(webView, newHandler);

      // Add the WebView to our set
      console.log(`[Native Bridge] WebView added to set. Current count: ${webViews.size + 1}`);
      webViews.add(webView);

      // Send initial state for all stores
      Object.entries(state).forEach(([key, value]) => {
        if (value !== undefined) {
          const initMessage = {
            type: "STATE_INIT",
            storeKey: key,
            data: value,
          };

          // Use postMessage to send initial state
          webView.postMessage(JSON.stringify(initMessage));
        }
      });

      // Return an unsubscribe function
      return () => {
        // Restore the original onMessage handler if it existed
        console.log("[Native Bridge] Unregistering WebView (via returned function)...");
        if (originalOnMessage) {
          webView.onMessage = originalOnMessage;
        } else {
          // If there was no original handler, remove our handler
          // @ts-ignore - We know we're setting it to undefined which may not be in the type
          webView.onMessage = undefined;
        }

        // Remove from the WebViews set
        webViews.delete(webView);

        // Clean up the WeakMaps
        originalOnMessageHandlers.delete(webView);
        messageHandlers.delete(webView);
      };
    },

    // Keep for backwards compatibility, but users should use the unsubscribe function from registerWebView
    unregisterWebView: (webView: WebView) => {
      // Restore the original onMessage handler if it existed
      console.log("[Native Bridge] Unregistering WebView (via unregisterWebView)...");
      const originalOnMessage = originalOnMessageHandlers.get(webView);
      if (originalOnMessage) {
        webView.onMessage = originalOnMessage;
      } else {
        // If there was no original handler, remove our handler
        // @ts-ignore - We know we're setting it to undefined which may not be in the type
        webView.onMessage = undefined;
      }

      // Remove from the WebViews set
      webViews.delete(webView);

      // Clean up the WeakMaps
      originalOnMessageHandlers.delete(webView);
      messageHandlers.delete(webView);

      // If no more WebViews, mark as not ready
      if (webViews.size === 0) {
        console.log("[Native Bridge] No WebViews registered. Setting isReady to false.");
        isReady = false;
        notifyReadyListeners();
      }
    },

    onWebViewReady: (callback: () => void) => {
      readyListeners.add(callback);
      // If already ready, call callback immediately
      if (isReady) {
        callback();
      }
      return () => {
        readyListeners.delete(callback);
      };
    },

    isWebViewReady: () => isReady,
  });

  return bridge;
} 