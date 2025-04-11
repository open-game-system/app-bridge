import type {
  Bridge,
  BridgeStores,
  WebView as BridgeWebView,
  Event,
  Store,
  State,
  StoreConfig,
  CreateStore,
  Producer,
  NativeBridge,
} from "@open-game-system/app-bridge-types";
import { compare } from "fast-json-patch";
import { produce } from "immer";

// Use the BridgeWebView interface from the types file
export type WebView = BridgeWebView;

// Message types for communication
type WebToNativeMessage<TStores extends BridgeStores = BridgeStores> =
  | { type: "BRIDGE_READY" }
  | {
      type: "EVENT";
      storeKey: keyof TStores;
      event: TStores[keyof TStores]["events"];
    };

type NativeToWebMessage<TStores extends BridgeStores = BridgeStores> =
  | {
      type: "STATE_INIT";
      storeKey: keyof TStores;
      data: TStores[keyof TStores]["state"];
    }
  | {
      type: "STATE_UPDATE";
      storeKey: keyof TStores;
      operations?: ReturnType<typeof compare>;
    };

/**
 * Creates a new store with the given configuration
 */
export const createStore: CreateStore = <S extends State, E extends Event>(
  config: StoreConfig<S, E>
) => {
  let currentState = config.initialState;
  const listeners = new Set<(state: S) => void>();

  const notifyListeners = () => {
    listeners.forEach(listener => listener(currentState));
  };

  return {
    getSnapshot: () => currentState,
    
    dispatch: (event: E) => {
      if (config.producer) {
        const nextState = produce(currentState, (draft: S) => {
          config.producer!(draft, event);
        });
        currentState = nextState;
        notifyListeners();
      }
    },

    subscribe: (listener: (state: S) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    reset: () => {
      currentState = config.initialState;
      notifyListeners();
    }
  };
};

// Return the imported NativeBridge type
export function createNativeBridge<TStores extends BridgeStores>(): NativeBridge<TStores> {
  const stores = new Map<keyof TStores, Store<any, any>>();
  const webViews = new Set<WebView>();
  const readyWebViews = new Set<WebView>();
  const readyStateListeners = new Map<WebView, Set<(isReady: boolean) => void>>();
  const storeListeners = new Set<() => void>();

  const notifyStoreListeners = () => {
    storeListeners.forEach(listener => listener());
  };

  const notifyReadyStateListeners = (webView: WebView, isReady: boolean) => {
    console.log(
      "[Native Bridge] Notifying ready state listeners for WebView:",
      { isReady, hasListeners: readyStateListeners.has(webView) }
    );
    const listeners = readyStateListeners.get(webView);
    if (listeners) {
      console.log(
        "[Native Bridge] Found",
        listeners.size,
        "listeners to notify"
      );
      listeners.forEach((listener) => {
        console.log(
          "[Native Bridge] Calling listener with ready state:",
          isReady
        );
        listener(isReady);
      });
    }
  };

  const broadcastToWebViews = (message: NativeToWebMessage<TStores>) => {
    const messageString = JSON.stringify(message);
    webViews.forEach((webView) => {
      webView.postMessage(messageString);
    });
  };

  const processWebViewMessage = (
    data: string,
    sourceWebView?: WebView
  ): void => {
    let parsedData: WebToNativeMessage;

    try {
      parsedData = JSON.parse(data);
      console.log("[Native Bridge] Received message:", parsedData);
    } catch (e) {
      console.warn("[Native Bridge] Failed to parse message:", data, e);
      return;
    }

    if (
      !parsedData ||
      typeof parsedData !== "object" ||
      !("type" in parsedData)
    ) {
      console.warn("[Native Bridge] Invalid message format:", parsedData);
      return;
    }

    switch (parsedData.type) {
      case "BRIDGE_READY": {
        if (sourceWebView) {
          readyWebViews.add(sourceWebView);
          notifyReadyStateListeners(sourceWebView, true);

          // Send initial state to this WebView
          stores.forEach((store, key) => {
            sourceWebView.postMessage(
              JSON.stringify({
                type: "STATE_INIT",
                storeKey: key,
                data: store.getSnapshot(),
              })
            );
          });
        } else {
          webViews.forEach((webView) => {
            readyWebViews.add(webView);
            notifyReadyStateListeners(webView, true);

            // Send initial state to each WebView
            stores.forEach((store, key) => {
              webView.postMessage(
                JSON.stringify({
                  type: "STATE_INIT",
                  storeKey: key,
                  data: store.getSnapshot(),
                })
              );
            });
          });
        }
        break;
      }
      case "EVENT": {
        const { storeKey, event } = parsedData;
        const store = stores.get(storeKey as keyof TStores);
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
        stores.set(key, store);

        readyWebViews.forEach(webView => {
          webView.postMessage(
            JSON.stringify({
              type: "STATE_INIT",
              storeKey: key,
              data: store.getSnapshot(),
            })
          );
        });

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
      processWebViewMessage(messageData);
    },

    registerWebView: (webView: WebView | null | undefined) => {
      if (!webView) return () => {};

      webViews.add(webView);

      // Send initial state to the WebView
      stores.forEach((store, key) => {
        webView.postMessage(
          JSON.stringify({
            type: "STATE_INIT",
            storeKey: key,
            data: store.getSnapshot(),
          })
        );
      });

      return () => {
        webViews.delete(webView);
        readyWebViews.delete(webView);
        readyStateListeners.delete(webView);
      };
    },

    unregisterWebView: (webView: WebView | null | undefined) => {
      if (!webView) return;
      webViews.delete(webView);
      readyWebViews.delete(webView);
      readyStateListeners.delete(webView);
    },

    subscribeToReadyState: (
      webView: WebView | null | undefined,
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
        const listeners = readyStateListeners.get(webView);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            readyStateListeners.delete(webView);
          }
        }
      };
    },

    getReadyState: (webView: WebView | null | undefined) => {
      if (!webView) return false;
      return readyWebViews.has(webView);
    },
  };
}
