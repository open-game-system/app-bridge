import { applyPatch } from "fast-json-patch";
import { Bridge, BridgeStores } from "../types";

export interface WebViewMessage {
  type: "STATE_UPDATE" | "EVENT";
  storeKey: string;
  data?: any;
  event?: any;
  operations?: any[];
}

export interface WebViewBridge {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: WebViewBridge;
  }
}

export function createWebBridge<
  TStores extends BridgeStores
>(): Bridge<TStores> {
  let state: { [K in keyof TStores]: TStores[K]["state"] | null } = {} as any;
  const listeners = new Map<keyof TStores, Set<(state: any) => void>>();

  const notifyListeners = <K extends keyof TStores>(storeKey: K) => {
    const storeListeners = listeners.get(storeKey);
    if (storeListeners) {
      storeListeners.forEach((listener) => listener(state[storeKey]));
    }
  };

  // Handle messages from native
  if (typeof window !== "undefined" && window.ReactNativeWebView) {
    window.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as WebViewMessage;
        if (message.type === "STATE_UPDATE") {
          if (message.operations) {
            // Apply patch operations
            const result = applyPatch(
              state[message.storeKey as keyof TStores],
              message.operations
            );
            state[message.storeKey as keyof TStores] = result.newDocument;
          } else {
            // Full state update
            state[message.storeKey as keyof TStores] = message.data;
          }
          notifyListeners(message.storeKey as keyof TStores);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });
  }

  return {
    isSupported: () =>
      typeof window !== "undefined" && !!window.ReactNativeWebView,

    getSnapshot: () => state,

    subscribe: <K extends keyof TStores>(
      storeKey: K,
      callback: (state: TStores[K]["state"]) => void
    ) => {
      if (!listeners.has(storeKey)) {
        listeners.set(storeKey, new Set());
      }
      const storeListeners = listeners.get(storeKey)!;
      storeListeners.add(callback);
      return () => {
        storeListeners.delete(callback);
      };
    },

    dispatch: <K extends keyof TStores>(
      storeKey: K,
      event: TStores[K]["events"]
    ) => {
      if (!window.ReactNativeWebView) {
        console.warn(
          "Cannot dispatch events: ReactNativeWebView not available"
        );
        return;
      }
      const message: WebViewMessage = {
        type: "EVENT",
        storeKey: storeKey as string,
        event,
      };
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
      notifyListeners(storeKey);
    },
  };
}
