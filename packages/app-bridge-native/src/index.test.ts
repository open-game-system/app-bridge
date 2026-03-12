import type { NativeBridge, BridgeStores, State } from "@open-game-system/app-bridge-types";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createNativeBridge, createStore, WebView } from "./index";

// Base state type with discriminator
interface CounterState extends State {
  value: number;
}

// Discriminated union for events
type CounterEvents = { type: "INCREMENT" } | { type: "DECREMENT" } | { type: "SET"; value: number };

type TestStores = BridgeStores<{
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
}>;

// Create a mock WebView implementation for testing
class MockWebView implements WebView {
  public onMessage: (event: { nativeEvent: { data: string } }) => void = () => {};
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

    bridge.setStore("counter", store);
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
      bridge.setStore("counter", store);
      expect(listener).toHaveBeenCalled();
    });

    test("handles store removal", () => {
      const listener = vi.fn();
      bridge.subscribe(listener);

      // Remove the store and verify listener was called
      bridge.setStore("counter", undefined);
      expect(listener).toHaveBeenCalled();

      // Verify store is no longer available
      expect(bridge.getStore("counter")).toBeUndefined();
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
        }),
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
        }),
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
        }),
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
        }),
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
        }),
      );

      expect(bridge.getReadyState(mockWebView)).toBe(true);
    });

    test("ignores invalid message formats without crashing", () => {
      // Kills mutants on line 172: validation guard for parsedData
      bridge.registerWebView(mockWebView);
      const store = bridge.getStore("counter");
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Non-object (null after JSON.parse)
      bridge.handleWebMessage(JSON.stringify(null));
      expect(store?.getSnapshot().value).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid message format"),
        null,
      );

      consoleWarnSpy.mockClear();

      // Primitive string (not an object)
      bridge.handleWebMessage(JSON.stringify("just a string"));
      expect(store?.getSnapshot().value).toBe(0);

      consoleWarnSpy.mockClear();

      // Object without 'type' field
      bridge.handleWebMessage(JSON.stringify({ foo: "bar" }));
      expect(store?.getSnapshot().value).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid message format"),
        expect.objectContaining({ foo: "bar" }),
      );

      consoleWarnSpy.mockRestore();
    });

    test("BRIDGE_READY sends STATE_INIT messages with correct type and data", () => {
      // Kills mutants on line 186: type: "STATE_INIT" → type: ""
      // and line 190: if (webView.postMessage) → if (true/false)
      bridge.registerWebView(mockWebView);
      mockWebView.messageQueue = []; // clear registration messages

      bridge.handleWebMessage(JSON.stringify({ type: "BRIDGE_READY" }));

      // Should have sent STATE_INIT for the counter store
      expect(mockWebView.messageQueue.length).toBe(1);
      const msg = JSON.parse(mockWebView.messageQueue[0]);
      expect(msg.type).toBe("STATE_INIT");
      expect(msg.storeKey).toBe("counter");
      expect(msg.data).toEqual({ value: 0 });
    });

    test("broadcastToWebViews tolerates WebView without postMessage", () => {
      // Kills mutant on line 152: if (webView.postMessage) → if (true)
      const brokenWebView = {} as WebView; // no postMessage method
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      bridge.registerWebView(brokenWebView);

      // setStore triggers broadcastToWebViews internally — should not throw
      const store2 = createStore({
        initialState: { value: 99 },
        producer: (draft: CounterState, event: CounterEvents) => {
          if (event.type === "INCREMENT") draft.value += 1;
        },
      });
      expect(() => bridge.setStore("counter", store2)).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("lacks postMessage"));

      consoleWarnSpy.mockRestore();
    });

    test("unparseable JSON message is warned and ignored", () => {
      // Kills mutant: JSON.parse catch path
      bridge.registerWebView(mockWebView);
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      bridge.handleWebMessage("not valid json {{{");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to parse message"),
        expect.any(String),
        expect.any(Error),
      );
      // Store state unchanged
      expect(bridge.getStore("counter")?.getSnapshot().value).toBe(0);

      consoleWarnSpy.mockRestore();
    });

    test("isSupported returns exactly true", () => {
      // Kills mutant: () => true → () => undefined
      expect(bridge.isSupported()).toBe(true);
    });

    test("handleWebMessage accepts nativeEvent object format", () => {
      // Kills mutant: typeof message === "string" ? message : message.nativeEvent.data → true ? message : ...
      bridge.registerWebView(mockWebView);
      const store = bridge.getStore("counter");

      // Use the nativeEvent object format instead of string
      bridge.handleWebMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: "EVENT",
            storeKey: "counter",
            event: { type: "INCREMENT" },
          }),
        },
      });

      expect(store?.getSnapshot().value).toBe(1);
    });

    test("STATE_UPDATE broadcast contains correct type and data on state change", () => {
      // Kills mutants: type: "STATE_UPDATE" → "" and broadcastToWebViews({}) empty object
      bridge.registerWebView(mockWebView);
      bridge.handleWebMessage(JSON.stringify({ type: "BRIDGE_READY" }));
      mockWebView.messageQueue = [];

      const store = bridge.getStore("counter");
      store?.dispatch({ type: "INCREMENT" });

      expect(mockWebView.messageQueue.length).toBe(1);
      const msg = JSON.parse(mockWebView.messageQueue[0]);
      expect(msg.type).toBe("STATE_UPDATE");
      expect(msg.storeKey).toBe("counter");
      expect(msg.operations).toBeDefined();
      expect(msg.operations.length).toBeGreaterThan(0);
    });

    test("no STATE_UPDATE broadcast when state does not change", () => {
      // Kills mutants: operations.length > 0 → >= 0 and → true
      bridge.registerWebView(mockWebView);
      bridge.handleWebMessage(JSON.stringify({ type: "BRIDGE_READY" }));
      mockWebView.messageQueue = [];

      // Dispatch SET with same value — no state change
      const store = bridge.getStore("counter");
      store?.dispatch({ type: "SET", value: 0 });

      // No STATE_UPDATE should be sent since state didn't change
      expect(mockWebView.messageQueue.length).toBe(0);
    });

    test("getReadyState returns false for null webView", () => {
      // Kills mutant: if (!webView) return false → if (false) return false
      expect(bridge.getReadyState(null)).toBe(false);
    });
  });
});
