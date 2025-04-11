import {
  State,
  Event,
  Store,
  CreateStore,
  StoreConfig,
  Producer,
  NativeBridge,
  StoreOnConfig,
  WebView as BridgeWebView,
  WebToNativeMessage,
  NativeToWebMessage,
  BridgeStores
} from "@open-game-system/app-bridge-types";
import { produce } from "immer";
import { compare } from "fast-json-patch";

// Re-export BridgeWebView as WebView for consistency within this package if needed
export type WebView = BridgeWebView;

/**
 * Creates a new store with the given configuration according to Plan v4.
 */
export const createStore: CreateStore = <
  S extends State,
  E extends Event
>(
  config: StoreConfig<S, E>
): Store<S, E> => {
  let currentState = config.initialState;
  const stateListeners = new Set<(state: S) => void>();
  const eventListeners = new Map<string, Set<(event: E, store: Store<S, E>) => Promise<void> | void>>();

  let storeInstance: Store<S, E>;

  const notifyStateListeners = () => {
    stateListeners.forEach(listener => listener(currentState));
  };

  const notifyEventListeners = (eventType: E['type'], event: E) => {
    const listeners = eventListeners.get(eventType as string);
    if (listeners) {
      listeners.forEach(listener => {
          try {
              const result = listener(event, storeInstance);
              if (result instanceof Promise) {
                  result.catch(error => {
                     console.error(`[Native Store] Unhandled promise rejection in async event listener for type "${eventType}":`, error);
                  });
              }
          } catch (error) {
              console.error(`[Native Store] Error in event listener for type "${eventType}":`, error);
          }
      });
    }
  };

  storeInstance = {
    getSnapshot: () => currentState,

    dispatch: (event: E): void => {
      let stateChanged = false;
      if (config.producer) {
        const nextState = produce(currentState, (draft: S) => {
          config.producer!(draft, event);
        });
        if (nextState !== currentState) {
            currentState = nextState;
            stateChanged = true;
        }
      }

      if (stateChanged) {
        notifyStateListeners();
      }

      notifyEventListeners(event.type as E['type'], event);
    },

    subscribe: (listener: (state: S) => void) => {
      stateListeners.add(listener);
      listener(currentState);
      return () => {
        stateListeners.delete(listener);
      };
    },

    on: <EventType extends E['type']>(
      eventType: EventType,
      listener: (event: Extract<E, { type: EventType }>, store: Store<S, E>) => Promise<void> | void
    ): (() => void) => {
       const eventTypeStr = eventType as string;
      if (!eventListeners.has(eventTypeStr)) {
        eventListeners.set(eventTypeStr, new Set());
      }
      const listeners = eventListeners.get(eventTypeStr)!;
      const typedListener = listener as (event: E, store: Store<S, E>) => Promise<void> | void;
      listeners.add(typedListener);

      return () => {
        listeners.delete(typedListener);
        if (listeners.size === 0) {
          eventListeners.delete(eventTypeStr);
        }
      };
    },

    reset: () => {
      currentState = config.initialState;
      notifyStateListeners();
    }
  };

  if (config.on) {
    for (const eventType in config.on) {
       if (Object.prototype.hasOwnProperty.call(config.on, eventType)) {
           const listener = config.on[eventType as E['type']];
           if (listener) {
               storeInstance.on(eventType as E['type'], listener);
           }
       }
    }
  }

  return storeInstance;
};

/**
 * Creates a native bridge instance using the BridgeWebView type from types package.
 */
export function createNativeBridge<TStores extends BridgeStores>(): NativeBridge<TStores> {
  const stores = new Map<keyof TStores, Store<TStores[keyof TStores]["state"], TStores[keyof TStores]["events"]>>();
  const webViews = new Set<BridgeWebView>();
  const readyWebViews = new Set<BridgeWebView>();
  const readyStateListeners = new Map<BridgeWebView, Set<(isReady: boolean) => void>>();
  const storeListeners = new Set<() => void>();

  const notifyStoreListeners = () => {
    storeListeners.forEach(listener => listener());
  };

  const notifyReadyStateListeners = (webView: BridgeWebView, isReady: boolean) => {
    const listeners = readyStateListeners.get(webView);
    if (listeners) {
      listeners.forEach((listener) => listener(isReady));
    }
  };

  const broadcastToWebViews = (message: NativeToWebMessage<TStores>) => {
    const messageString = JSON.stringify(message);
    webViews.forEach((webView) => {
      if (webView.postMessage) {
         webView.postMessage(messageString);
      } else {
         console.warn("[Native Bridge] WebView instance lacks postMessage method.");
      }
    });
  };

  const processWebViewMessage = (
    data: string,
    sourceWebView?: BridgeWebView
  ): void => {
    let parsedData: WebToNativeMessage;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.warn("[Native Bridge] Failed to parse message:", data, e);
      return;
    }

    if (!parsedData || typeof parsedData !== 'object' || !('type' in parsedData)) {
      console.warn("[Native Bridge] Invalid message format:", parsedData);
      return;
    }

    switch (parsedData.type) {
      case "BRIDGE_READY": {
        const targetWebViews = sourceWebView ? [sourceWebView] : Array.from(webViews);
        targetWebViews.forEach(webView => {
            if (!webView) return;
            readyWebViews.add(webView);
            notifyReadyStateListeners(webView, true);
            stores.forEach((store, key) => {
                const initMessage = JSON.stringify({
                    type: "STATE_INIT",
                    storeKey: key,
                    data: store.getSnapshot(),
                });
                if (webView.postMessage) webView.postMessage(initMessage);
            });
        });
        break;
      }
      case "EVENT": {
        const { storeKey, event } = parsedData;
        const store = stores.get(storeKey as keyof TStores) as Store<any, typeof event> | undefined;
        if (store) {
          store.dispatch(event);
        }
        break;
      }
    }
  };

  return {
    isSupported: () => true,

    getStore: <K extends keyof TStores>(key: K) => {
      return stores.get(key) as Store<TStores[K]["state"], TStores[K]["events"]> | undefined;
    },

    setStore: <K extends keyof TStores>(
      key: K,
      store: Store<TStores[K]["state"], TStores[K]["events"]> | undefined
    ) => {
      if (store === undefined) {
        stores.delete(key);
      } else {
        let prevState = store.getSnapshot();
        stores.set(key, store as Store<any, any>);

        const initMessage = {
          type: "STATE_INIT" as const,
          storeKey: key,
          data: store.getSnapshot(),
        };
        broadcastToWebViews(initMessage);

        store.subscribe((currentState: TStores[K]["state"]) => {
          const operations = compare(prevState, currentState);
          if (operations.length > 0) {
            broadcastToWebViews({
              type: "STATE_UPDATE",
              storeKey: key,
              operations,
            });
          }
          prevState = currentState;
        });
      }
      notifyStoreListeners();
    },

    subscribe: (listener: () => void) => {
      storeListeners.add(listener);
      return () => {
        storeListeners.delete(listener);
      };
    },

    handleWebMessage: (message: string | { nativeEvent: { data: string } }) => {
      const messageData =
        typeof message === "string" ? message : message.nativeEvent.data;
      processWebViewMessage(messageData, undefined);
    },

    registerWebView: (webView: BridgeWebView | null | undefined) => {
      if (!webView) return () => {};
      webViews.add(webView);
      stores.forEach((store, key) => {
         const initMessage = JSON.stringify({
            type: "STATE_INIT",
            storeKey: key,
            data: store.getSnapshot(),
         });
         if (webView.postMessage) webView.postMessage(initMessage);
      });
      return () => {
        webViews.delete(webView);
        readyWebViews.delete(webView);
        readyStateListeners.delete(webView);
      };
    },

    unregisterWebView: (webView: BridgeWebView | null | undefined) => {
      if (!webView) return;
      webViews.delete(webView);
      readyWebViews.delete(webView);
      readyStateListeners.delete(webView);
    },

    subscribeToReadyState: (
      webView: BridgeWebView | null | undefined,
      callback: (isReady: boolean) => void
    ) => {
      if (!webView) {
        callback(false);
        return () => {};
      }
      let listeners = readyStateListeners.get(webView);
      if (!listeners) {
        listeners = new Set();
        readyStateListeners.set(webView, listeners);
      }
      listeners.add(callback);
      callback(readyWebViews.has(webView));
      return () => {
        const currentListeners = readyStateListeners.get(webView);
        if (currentListeners) {
          currentListeners.delete(callback);
          if (currentListeners.size === 0) {
            readyStateListeners.delete(webView);
          }
        }
      };
    },

    getReadyState: (webView: BridgeWebView | null | undefined) => {
      if (!webView) return false;
      return readyWebViews.has(webView);
    },
  };
}
