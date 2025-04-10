import type { NativeBridge, BridgeStores, State } from "@open-game-system/app-bridge-types";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createNativeBridge, createStore, WebView } from "./index";

// Base state type with discriminator
interface CounterState extends State {
  value: number;
}

// Discriminated union for events
type CounterEvents =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };

type TestStores = BridgeStores<{
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
}>;

// Create a mock WebView implementation for testing
class MockWebView implements WebView {
  public onMessage: (event: { nativeEvent: { data: string } }) => void =
    () => {};
  public messageQueue: string[] = [];

  postMessage(message: string): void {
    this.messageQueue.push(message);
  }

  injectJavaScript(script: string): void {
    // No-op for testing
  }
}

describe("NativeBridge", () => {
  let bridge: NativeBridge<TestStores>;
  let mockWebView: MockWebView;

  beforeEach(() => {
    mockWebView = new MockWebView();
    bridge = createNativeBridge<TestStores>();

    // Create and register a store
    const store = createStore({
      initialState: { value: 0 },
      producer: (draft: CounterState, event: CounterEvents) => {
        switch (event.type) {
          case "INCREMENT":
            draft.value += 1;
            break;
          case "DECREMENT":
            draft.value -= 1;
            break;
          case "SET":
            draft.value = event.value;
            break;
        }
      },
    });

    bridge.setStore('counter', store);
  });

  describe("Store Management", () => {
    test("provides access to stores", () => {
      const store = bridge.getStore("counter");
      expect(store).toBeDefined();
      expect(store?.getSnapshot()).toEqual({ value: 0 });
    });

    test("allows subscribing to store state", () => {
      const store = bridge.getStore("counter");
      const listener = vi.fn();

      store?.subscribe(listener);
      store?.dispatch({ type: "INCREMENT" });

      const snapshot = store?.getSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot?.value).toBe(1);
      expect(listener).toHaveBeenCalledWith({ value: 1 });
    });

    test("notifies store availability subscribers", () => {
      const listener = vi.fn();
      bridge.subscribe(listener);

      // Create a new store
      const store = createStore({
        initialState: { value: 42 },
        producer: (draft: CounterState, event: CounterEvents) => {
          if (event.type === "INCREMENT") draft.value += 1;
        },
      });

      // Set the store and verify listener was called
      bridge.setStore('counter', store);
      expect(listener).toHaveBeenCalled();
    });

    test("handles store removal", () => {
      const listener = vi.fn();
      bridge.subscribe(listener);

      // Remove the store and verify listener was called
      bridge.setStore('counter', undefined);
      expect(listener).toHaveBeenCalled();

      // Verify store is no longer available
      expect(bridge.getStore('counter')).toBeUndefined();
    });
  });

  describe("WebView Integration", () => {
    test("handles WebView registration with null value", () => {
      const unsubscribe = bridge.registerWebView(null);
      expect(typeof unsubscribe).toBe("function");
    });

    test("registers WebView and receives initial state", () => {
      const unsubscribe = bridge.registerWebView(mockWebView);

      expect(mockWebView.messageQueue.length).toBeGreaterThan(0);
      const message = JSON.parse(mockWebView.messageQueue[0]);
      expect(message.type).toBe("STATE_INIT");
      expect(message.storeKey).toBe("counter");
      expect(message.data).toEqual({ value: 0 });

      unsubscribe();
    });

    test("handles ready state subscription", () => {
      const readyListener = vi.fn();
      
      // Register the WebView first
      bridge.registerWebView(mockWebView);
      
      // Then subscribe to ready state
      bridge.subscribeToReadyState(mockWebView, readyListener);

      // Should be called immediately with initial state (false)
      expect(readyListener).toHaveBeenCalledWith(false);

      // Simulate BRIDGE_READY message
      bridge.handleWebMessage(
        JSON.stringify({
          type: "BRIDGE_READY",
        })
      );

      // Should be called with true when ready
      expect(readyListener).toHaveBeenCalledWith(true);
    });

    test("handles ready state subscription with null WebView", () => {
      const readyListener = vi.fn();
      const unsubscribe = bridge.subscribeToReadyState(null, readyListener);

      // Should be called immediately with false
      expect(readyListener).toHaveBeenCalledWith(false);

      // Should be a no-op unsubscribe
      expect(() => unsubscribe()).not.toThrow();
    });

    test("unregisters WebView properly", () => {
      const unsubscribe = bridge.registerWebView(mockWebView);
      const readyListener = vi.fn();

      bridge.subscribeToReadyState(mockWebView, readyListener);
      bridge.handleWebMessage(
        JSON.stringify({
          type: "BRIDGE_READY",
        })
      );

      // Clear initial messages
      mockWebView.messageQueue = [];

      // Unregister
      unsubscribe();

      // Should no longer receive messages
      const store = bridge.getStore("counter");
      store?.dispatch({ type: "INCREMENT" });

      expect(mockWebView.messageQueue.length).toBe(0);
    });

    test("handles message events from multiple WebViews", () => {
      const webView1 = new MockWebView();
      const webView2 = new MockWebView();

      bridge.registerWebView(webView1);
      bridge.registerWebView(webView2);

      // Send ready message from both WebViews
      bridge.handleWebMessage(
        JSON.stringify({
          type: "BRIDGE_READY",
        })
      );

      // Clear message queues
      webView1.messageQueue = [];
      webView2.messageQueue = [];

      // Dispatch an event to trigger state change
      const store = bridge.getStore("counter");
      store?.dispatch({ type: "INCREMENT" });

      // Both WebViews should receive the update
      expect(webView1.messageQueue.length).toBe(1);
      expect(webView2.messageQueue.length).toBe(1);
    });

    test("handles incoming events from WebView", () => {
      bridge.registerWebView(mockWebView);
      const store = bridge.getStore("counter");
      const listener = vi.fn();
      store?.subscribe(listener);

      // Simulate an INCREMENT event from the WebView
      bridge.handleWebMessage(
        JSON.stringify({
          type: "EVENT",
          storeKey: "counter",
          event: { type: "INCREMENT" },
        })
      );

      const snapshot = store?.getSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot?.value).toBe(1);
      expect(listener).toHaveBeenCalledWith({ value: 1 });
    });

    test("tracks WebView ready state", () => {
      bridge.registerWebView(mockWebView);
      expect(bridge.getReadyState(mockWebView)).toBe(false);

      bridge.handleWebMessage(
        JSON.stringify({
          type: "BRIDGE_READY",
        })
      );

      expect(bridge.getReadyState(mockWebView)).toBe(true);
    });
  });
});
